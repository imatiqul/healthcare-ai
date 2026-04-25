using FluentAssertions;
using HealthQCopilot.Fhir.Hl7v2;
using System.Text;
using Xunit;

namespace HealthQCopilot.Tests.Unit.Fhir;

/// <summary>
/// Unit tests for the lightweight HL7 v2 message parser (Hl7v2Message).
/// Covers MSH header extraction, segment access, component/repetition navigation,
/// multi-occurrence segments (e.g. OBX), and error handling.
/// </summary>
public class Hl7v2MessageParserTests
{
    // Minimal well-formed ADT^A01 message used by most tests
    private const string AdtA01 =
        "MSH|^~\\&|HIS|GENERAL|LAB|GENERAL|20240101120000||ADT^A01|MSG001|P|2.5\r" +
        "EVN|A01|20240101120000\r" +
        "PID|1||MRN12345^^^HIS||Smith^John^A||19800315|M|||123 Main St^^Boston^MA^02101\r" +
        "PV1|1|I|ICU^01^A|E|||DOC456^Johnson^Robert^^MD|||||ADM|||||||V001\r";

    private const string OruR01 =
        "MSH|^~\\&|LAB|GENERAL|HIS|GENERAL|20240101150000||ORU^R01|MSG002|P|2.5\r" +
        "PID|1||MRN99999^^^HIS||Doe^Jane\r" +
        "OBR|1|ORD001|FIL001|CBC^Complete Blood Count\r" +
        "OBX|1|NM|718-7^Hemoglobin^LN||13.5|g/dL|12.0-16.0||||F\r" +
        "OBX|2|NM|2823-3^Potassium^LN||4.2|mEq/L|3.5-5.5||||F\r" +
        "OBX|3|NM|2345-7^Glucose^LN||95|mg/dL|70-110||||F\r";

    // ── MSH header parsing ────────────────────────────────────────────────────

    [Fact]
    public void Parse_ExtractsMessageTypeAndEventTrigger()
    {
        var msg = Hl7v2Message.Parse(AdtA01);

        msg.MessageType.Should().Be("ADT");
        msg.EventTrigger.Should().Be("A01");
    }

    [Fact]
    public void Parse_ExtractsMessageControlId()
    {
        var msg = Hl7v2Message.Parse(AdtA01);

        msg.MessageControlId.Should().Be("MSG001");
    }

    [Fact]
    public void Parse_ExtractsSendingApplicationAndFacility()
    {
        var msg = Hl7v2Message.Parse(AdtA01);

        msg.SendingApplication.Should().Be("HIS");
        msg.SendingFacility.Should().Be("GENERAL");
    }

    [Fact]
    public void Parse_ExtractsTimestampAndVersion()
    {
        var msg = Hl7v2Message.Parse(AdtA01);

        msg.Timestamp.Should().Be("20240101120000");
        msg.Version.Should().Be("2.5");
    }

    // ── ORU^R01 header ────────────────────────────────────────────────────────

    [Fact]
    public void Parse_OruR01_ExtractsCorrectTypeAndTrigger()
    {
        var msg = Hl7v2Message.Parse(OruR01);

        msg.MessageType.Should().Be("ORU");
        msg.EventTrigger.Should().Be("R01");
        msg.MessageControlId.Should().Be("MSG002");
    }

    // ── Segment presence ──────────────────────────────────────────────────────

    [Fact]
    public void HasSegment_PresentSegment_ReturnsTrue()
    {
        var msg = Hl7v2Message.Parse(AdtA01);

        msg.HasSegment("PID").Should().BeTrue();
        msg.HasSegment("PV1").Should().BeTrue();
        msg.HasSegment("EVN").Should().BeTrue();
    }

    [Fact]
    public void HasSegment_AbsentSegment_ReturnsFalse()
    {
        var msg = Hl7v2Message.Parse(AdtA01);

        msg.HasSegment("OBX").Should().BeFalse();
        msg.HasSegment("ZZZ").Should().BeFalse();
    }

    // ── Field/component access ────────────────────────────────────────────────

    [Fact]
    public void GetFields_PidSegment_ReturnsPatientName()
    {
        var msg = Hl7v2Message.Parse(AdtA01);
        var pid = msg.GetFields("PID");

        // PID-5: family name ^ given name ^ middle initial
        pid.Get(4, 0, 0).Should().Be("Smith");   // family
        pid.Get(4, 0, 1).Should().Be("John");    // given
        pid.Get(4, 0, 2).Should().Be("A");       // middle
    }

    [Fact]
    public void GetFields_PidSegment_ReturnsMrn()
    {
        var msg = Hl7v2Message.Parse(AdtA01);
        var pid = msg.GetFields("PID");

        // PID-3 = MRN^^^HIS → field[2], component[0]
        pid.Get(2, 0, 0).Should().Be("MRN12345");
    }

    [Fact]
    public void GetFields_PidSegment_ReturnsDob()
    {
        var msg = Hl7v2Message.Parse(AdtA01);
        var pid = msg.GetFields("PID");

        // PID-7 = DateOfBirth → field index 6
        pid.Get(6, 0, 0).Should().Be("19800315");
    }

    [Fact]
    public void GetFields_OutOfBoundsField_ReturnsEmptyString()
    {
        var msg = Hl7v2Message.Parse(AdtA01);
        var pid = msg.GetFields("PID");

        pid.Get(999, 0, 0).Should().Be(string.Empty);
        pid.Get(0, 999, 0).Should().Be(string.Empty);
        pid.Get(0, 0, 999).Should().Be(string.Empty);
    }

    [Fact]
    public void GetFields_MissingSegment_ReturnsEmptySegmentFields()
    {
        var msg = Hl7v2Message.Parse(AdtA01);
        var obx = msg.GetFields("OBX");

        obx.Get(0, 0, 0).Should().Be(string.Empty);
    }

    // ── Multi-occurrence segments (OBX) ──────────────────────────────────────

    [Fact]
    public void SegmentCount_OruR01WithThreeObx_ReturnsThree()
    {
        var msg = Hl7v2Message.Parse(OruR01);

        msg.SegmentCount("OBX").Should().Be(3);
    }

    [Fact]
    public void GetFields_OruR01_FirstObxContainsHemoglobin()
    {
        var msg = Hl7v2Message.Parse(OruR01);
        var obx0 = msg.GetFields("OBX", occurrence: 0);

        // OBX-3: observation identifier code^name^coding system
        obx0.Get(2, 0, 0).Should().Be("718-7");
        obx0.Get(2, 0, 1).Should().Be("Hemoglobin");
        // OBX-5: observation value
        obx0.Get(4, 0, 0).Should().Be("13.5");
    }

    [Fact]
    public void GetFields_OruR01_SecondObxContainsPotassium()
    {
        var msg = Hl7v2Message.Parse(OruR01);
        var obx1 = msg.GetFields("OBX", occurrence: 1);

        obx1.Get(2, 0, 0).Should().Be("2823-3");
        obx1.Get(4, 0, 0).Should().Be("4.2");
    }

    [Fact]
    public void GetFields_OruR01_ThirdObxContainsGlucose()
    {
        var msg = Hl7v2Message.Parse(OruR01);
        var obx2 = msg.GetFields("OBX", occurrence: 2);

        obx2.Get(2, 0, 0).Should().Be("2345-7");
        obx2.Get(4, 0, 0).Should().Be("95");
    }

    [Fact]
    public void GetFields_ObxOutOfRange_ReturnsEmptySegmentFields()
    {
        var msg = Hl7v2Message.Parse(OruR01);
        var obx99 = msg.GetFields("OBX", occurrence: 99);

        obx99.Get(0, 0, 0).Should().Be(string.Empty);
    }

    // ── Line-ending normalisation ─────────────────────────────────────────────

    [Fact]
    public void Parse_CrLfLineEndings_ParsedSameAsCrOnly()
    {
        var crlf = AdtA01.Replace("\r", "\r\n");
        var msg = Hl7v2Message.Parse(crlf);

        msg.MessageType.Should().Be("ADT");
        msg.EventTrigger.Should().Be("A01");
        msg.MessageControlId.Should().Be("MSG001");
    }

    // ── Byte[] overload ───────────────────────────────────────────────────────

    [Fact]
    public void ParseBytes_Utf8EncodedMessage_ParsedCorrectly()
    {
        var bytes = Encoding.UTF8.GetBytes(AdtA01);
        var msg = Hl7v2Message.Parse(bytes);

        msg.MessageType.Should().Be("ADT");
        msg.EventTrigger.Should().Be("A01");
    }

    // ── Error handling ────────────────────────────────────────────────────────

    [Fact]
    public void Parse_EmptyString_ThrowsFormatException()
    {
        var act = () => Hl7v2Message.Parse(string.Empty);

        act.Should().Throw<FormatException>()
            .WithMessage("*MSH*");
    }

    [Fact]
    public void Parse_NoMshSegment_ThrowsFormatException()
    {
        var act = () => Hl7v2Message.Parse("PID|1||MRN001\rPV1|1\r");

        act.Should().Throw<FormatException>()
            .WithMessage("*MSH*");
    }

    // ── PV1 segment (attending physician) ────────────────────────────────────

    [Fact]
    public void GetFields_Pv1_ReturnsAttendingPhysicianId()
    {
        var msg = Hl7v2Message.Parse(AdtA01);
        var pv1 = msg.GetFields("PV1");

        // PV1-7: attending doctor (DOC456^Johnson^Robert^^MD)
        pv1.Get(6, 0, 0).Should().Be("DOC456");
        pv1.Get(6, 0, 1).Should().Be("Johnson");
    }

    // ── Case-insensitive segment lookup ──────────────────────────────────────

    [Fact]
    public void HasSegment_CaseInsensitiveLookup_ReturnsTrue()
    {
        var msg = Hl7v2Message.Parse(AdtA01);

        msg.HasSegment("pid").Should().BeTrue();
        msg.HasSegment("Pid").Should().BeTrue();
        msg.HasSegment("PID").Should().BeTrue();
    }
}

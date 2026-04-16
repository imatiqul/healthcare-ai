using FluentAssertions;
using HealthQCopilot.Domain.Ocr;
using HealthQCopilot.Domain.Ocr.Events;
using Xunit;

namespace HealthQCopilot.Tests.Unit.Domain;

public class OcrJobTests
{
    [Fact]
    public void Create_ShouldSetQueuedStatus()
    {
        var job = OcrJob.Create(Guid.NewGuid(), "https://blob/doc.pdf", "patient-1");

        job.Status.Should().Be(OcrJobStatus.Queued);
        job.DocumentUrl.Should().Be("https://blob/doc.pdf");
        job.PatientId.Should().Be("patient-1");
    }

    [Fact]
    public void MarkProcessing_ShouldUpdateStatus()
    {
        var job = OcrJob.Create(Guid.NewGuid(), "https://blob/doc.pdf", null);

        job.MarkProcessing();

        job.Status.Should().Be(OcrJobStatus.Processing);
    }

    [Fact]
    public void Complete_ShouldSetExtractedText_AndRaiseEvent()
    {
        var job = OcrJob.Create(Guid.NewGuid(), "https://blob/doc.pdf", "patient-1");
        job.MarkProcessing();

        job.Complete("Extracted clinical notes", "DocumentReference/456");

        job.Status.Should().Be(OcrJobStatus.Completed);
        job.ExtractedText.Should().Be("Extracted clinical notes");
        job.FhirDocumentReferenceId.Should().Be("DocumentReference/456");
        job.CompletedAt.Should().NotBeNull();
        job.DomainEvents.Should().ContainSingle()
            .Which.Should().BeOfType<DocumentProcessed>();
    }

    [Fact]
    public void Fail_ShouldSetFailedStatus()
    {
        var job = OcrJob.Create(Guid.NewGuid(), "https://blob/doc.pdf", null);
        job.MarkProcessing();

        job.Fail();

        job.Status.Should().Be(OcrJobStatus.Failed);
    }
}

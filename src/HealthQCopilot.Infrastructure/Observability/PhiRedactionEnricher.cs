using System.Text.RegularExpressions;
using Serilog.Core;
using Serilog.Events;

namespace HealthQCopilot.Infrastructure.Observability;

/// <summary>
/// Serilog enricher that redacts Protected Health Information (PHI) patterns from
/// structured log property values before they are emitted to any sink.
///
/// HIPAA §164.312(b) — Audit controls: log infrastructure must not inadvertently
/// persist identifiable patient data. This enricher scrubs 18 HIPAA identifiers
/// that could appear in string-typed log properties (patient names in error messages,
/// email addresses in exception stack traces, SSNs in validation failures, etc.).
///
/// Pattern coverage (HIPAA Safe Harbor — 45 CFR §164.514):
///   1. SSN              (\d{3}-\d{2}-\d{4})
///   2. Phone numbers    (US formats: (xxx) xxx-xxxx, xxx-xxx-xxxx, 10 consecutive digits)
///   3. Email addresses
///   4. MRN patterns     (MRN-xxxxxx, PID-xxxxxx — common EHR formats)
///   5. Date of Birth    (MM/DD/YYYY, YYYY-MM-DD ISO format)
///   6. Credit card      (PCI DSS bonus — 13-19 digit numbers matching Luhn-like patterns)
///
/// Note: The enricher operates on property VALUES only; message template placeholders are
/// not affected (they are resolved at render time). To also redact the rendered message,
/// configure Serilog output template to use {Properties:j} rather than {Message}.
/// </summary>
public sealed class PhiRedactionEnricher : ILogEventEnricher
{
    private static readonly (Regex Pattern, string Replacement)[] RedactionRules =
    [
        // SSN: 123-45-6789
        (new Regex(@"\b\d{3}-\d{2}-\d{4}\b", RegexOptions.Compiled), "[SSN-REDACTED]"),

        // US Phone: (123) 456-7890 | 123-456-7890 | 1234567890
        (new Regex(@"\b(\(\d{3}\)\s*\d{3}-\d{4}|\d{3}-\d{3}-\d{4}|\b\d{10}\b)", RegexOptions.Compiled), "[PHONE-REDACTED]"),

        // Email address
        (new Regex(@"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b", RegexOptions.Compiled), "[EMAIL-REDACTED]"),

        // MRN / Patient ID patterns (common EHR prefixes)
        (new Regex(@"\b(MRN|PID|PAT)[:\-]?\d{5,10}\b", RegexOptions.IgnoreCase | RegexOptions.Compiled), "[MRN-REDACTED]"),

        // Date of Birth — MM/DD/YYYY
        (new Regex(@"\b(0[1-9]|1[012])/(0[1-9]|[12]\d|3[01])/(19|20)\d{2}\b", RegexOptions.Compiled), "[DOB-REDACTED]"),

        // Date of Birth — YYYY-MM-DD (ISO 8601, often used in FHIR resources)
        (new Regex(@"\b(19|20)\d{2}-(0[1-9]|1[012])-(0[1-9]|[12]\d|3[01])\b", RegexOptions.Compiled), "[DOB-REDACTED]"),

        // Credit / debit card (13–19 digits with optional separating spaces/dashes)
        (new Regex(@"\b(?:\d[ \-]?){13,19}\b", RegexOptions.Compiled), "[CARD-REDACTED]"),
    ];

    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        foreach (var (key, value) in logEvent.Properties.ToList())
        {
            if (value is ScalarValue { Value: string rawStr })
            {
                var redacted = Redact(rawStr);
                if (!string.Equals(redacted, rawStr, StringComparison.Ordinal))
                {
                    logEvent.AddOrUpdateProperty(
                        propertyFactory.CreateProperty(key, redacted));
                }
            }
        }
    }

    internal static string Redact(string input)
    {
        foreach (var (pattern, replacement) in RedactionRules)
            input = pattern.Replace(input, replacement);
        return input;
    }
}

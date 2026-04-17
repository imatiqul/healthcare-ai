using FluentValidation;
using HealthQCopilot.Agents.Endpoints;

namespace HealthQCopilot.Agents.Validators;

public sealed class StartDemoRequestValidator : AbstractValidator<StartDemoRequest>
{
    public StartDemoRequestValidator()
    {
        RuleFor(x => x.ClientName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Company).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).MaximumLength(320)
            .EmailAddress().When(x => !string.IsNullOrEmpty(x.Email));
    }
}

public sealed class SubmitStepFeedbackRequestValidator : AbstractValidator<SubmitStepFeedbackRequest>
{
    public SubmitStepFeedbackRequestValidator()
    {
        RuleFor(x => x.Step).NotEmpty();
        RuleFor(x => x.Rating).InclusiveBetween(1, 5);
        RuleFor(x => x.Tags).NotNull();
        RuleForEach(x => x.Tags).MaximumLength(50);
    }
}

public sealed class CompleteDemoRequestValidator : AbstractValidator<CompleteDemoRequest>
{
    public CompleteDemoRequestValidator()
    {
        RuleFor(x => x.NpsScore).InclusiveBetween(0, 10);
        RuleFor(x => x.FeaturePriorities).NotNull();
        RuleForEach(x => x.FeaturePriorities).MaximumLength(100);
    }
}

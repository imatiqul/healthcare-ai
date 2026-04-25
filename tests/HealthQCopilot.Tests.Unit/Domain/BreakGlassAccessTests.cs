using FluentAssertions;
using HealthQCopilot.Domain.Identity;
using Xunit;

namespace HealthQCopilot.Tests.Unit.Domain;

public class BreakGlassAccessTests
{
    private static BreakGlassAccess CreateAccess(
        TimeSpan? validFor = null,
        string justification = "Patient in cardiac arrest — immediate PHI access required") =>
        BreakGlassAccess.Create(
            requestedByUserId: Guid.NewGuid(),
            targetPatientId: "patient-emergency-001",
            clinicalJustification: justification,
            validFor: validFor);

    // ── Create ────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_SetsActiveStatusAndGrantedAt()
    {
        var access = CreateAccess();

        access.Id.Should().NotBeEmpty();
        access.Status.Should().Be(BreakGlassStatus.Active);
        access.TargetPatientId.Should().Be("patient-emergency-001");
        access.GrantedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
        access.RevokedByUserId.Should().BeNull();
        access.RevokedAt.Should().BeNull();
    }

    [Fact]
    public void Create_DefaultsToFourHourExpiry()
    {
        var before = DateTime.UtcNow;
        var access = CreateAccess();

        access.ExpiresAt.Should().BeCloseTo(before.AddHours(4), TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Create_HonoursCustomValidFor()
    {
        var before = DateTime.UtcNow;
        var access = CreateAccess(validFor: TimeSpan.FromMinutes(30));

        access.ExpiresAt.Should().BeCloseTo(before.AddMinutes(30), TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Create_RaisesBreakGlassAccessGrantedEvent()
    {
        var access = CreateAccess();

        var evt = access.DomainEvents.OfType<BreakGlassAccessGranted>().Single();
        evt.AccessId.Should().Be(access.Id);
        evt.TargetPatientId.Should().Be("patient-emergency-001");
        evt.ClinicalJustification.Should().Contain("cardiac");
    }

    [Fact]
    public void Create_EmptyJustification_Throws()
    {
        var act = () => CreateAccess(justification: "");

        act.Should().Throw<ArgumentException>()
            .WithMessage("*justification*");
    }

    [Fact]
    public void Create_WhitespaceJustification_Throws()
    {
        var act = () => CreateAccess(justification: "   ");

        act.Should().Throw<ArgumentException>();
    }

    // ── IsValid ───────────────────────────────────────────────────────────────

    [Fact]
    public void IsValid_WhenActiveAndNotExpired_ReturnsTrue()
    {
        var access = CreateAccess(validFor: TimeSpan.FromHours(4));

        access.IsValid().Should().BeTrue();
    }

    [Fact]
    public void IsValid_WhenRevoked_ReturnsFalse()
    {
        var access = CreateAccess();
        access.Revoke(Guid.NewGuid());

        access.IsValid().Should().BeFalse();
    }

    [Fact]
    public void IsValid_WhenExpired_ReturnsFalse()
    {
        var access = CreateAccess(validFor: TimeSpan.FromMilliseconds(-1));

        access.IsValid().Should().BeFalse();
    }

    // ── Revoke ────────────────────────────────────────────────────────────────

    [Fact]
    public void Revoke_TransitionsToRevokedAndRaisesEvent()
    {
        var access = CreateAccess();
        var supervisorId = Guid.NewGuid();
        access.ClearDomainEvents();

        var result = access.Revoke(supervisorId, "Supervisor override");

        result.IsSuccess.Should().BeTrue();
        access.Status.Should().Be(BreakGlassStatus.Revoked);
        access.RevokedByUserId.Should().Be(supervisorId);
        access.RevokedAt.Should().NotBeNull();
        access.RevocationReason.Should().Be("Supervisor override");

        var evt = access.DomainEvents.OfType<BreakGlassAccessRevoked>().Single();
        evt.AccessId.Should().Be(access.Id);
        evt.RevokedByUserId.Should().Be(supervisorId);
    }

    [Fact]
    public void Revoke_AlreadyRevoked_ReturnsFailure()
    {
        var access = CreateAccess();
        access.Revoke(Guid.NewGuid());

        var result = access.Revoke(Guid.NewGuid());

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("already revoked");
    }

    [Fact]
    public void Revoke_AfterExpiry_ReturnsFailure()
    {
        var access = CreateAccess(validFor: TimeSpan.FromMilliseconds(-1));
        access.MarkExpired();

        var result = access.Revoke(Guid.NewGuid());

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("expired");
    }

    // ── MarkExpired ───────────────────────────────────────────────────────────

    [Fact]
    public void MarkExpired_ActiveSession_TransitionsToExpired()
    {
        var access = CreateAccess();

        access.MarkExpired();

        access.Status.Should().Be(BreakGlassStatus.Expired);
    }

    [Fact]
    public void MarkExpired_AlreadyRevoked_DoesNotChangeStatus()
    {
        var access = CreateAccess();
        access.Revoke(Guid.NewGuid());

        access.MarkExpired();

        // Revoked should win — MarkExpired is a no-op if not Active
        access.Status.Should().Be(BreakGlassStatus.Revoked);
    }
}

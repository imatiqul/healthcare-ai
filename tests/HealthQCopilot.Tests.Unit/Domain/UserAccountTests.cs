using HealthQCopilot.Domain.Identity;
using FluentAssertions;
using Xunit;

namespace HealthQCopilot.Tests.Unit.Domain;

public class UserAccountTests
{
    [Fact]
    public void Create_SetsProperties()
    {
        var id = Guid.NewGuid();
        var user = UserAccount.Create(id, "ext-1", "john@example.com", "John Doe", UserRole.Practitioner);

        user.Id.Should().Be(id);
        user.ExternalId.Should().Be("ext-1");
        user.Email.Should().Be("john@example.com");
        user.DisplayName.Should().Be("John Doe");
        user.Role.Should().Be(UserRole.Practitioner);
        user.IsActive.Should().BeTrue();
        user.LastLoginAt.Should().BeNull();
    }

    [Fact]
    public void RecordLogin_SetsLastLoginAt()
    {
        var user = UserAccount.Create(Guid.NewGuid(), "ext-1", "a@b.com", "A", UserRole.Patient);
        var before = DateTime.UtcNow;

        user.RecordLogin();

        user.LastLoginAt.Should().NotBeNull();
        user.LastLoginAt.Should().BeOnOrAfter(before);
    }

    [Fact]
    public void Deactivate_SetsIsActiveFalse()
    {
        var user = UserAccount.Create(Guid.NewGuid(), "ext-1", "a@b.com", "A", UserRole.Admin);

        user.Deactivate();

        user.IsActive.Should().BeFalse();
    }

    [Fact]
    public void Activate_AfterDeactivate_SetsIsActiveTrue()
    {
        var user = UserAccount.Create(Guid.NewGuid(), "ext-1", "a@b.com", "A", UserRole.Admin);
        user.Deactivate();

        user.Activate();

        user.IsActive.Should().BeTrue();
    }

    [Theory]
    [InlineData(UserRole.Patient)]
    [InlineData(UserRole.Practitioner)]
    [InlineData(UserRole.Admin)]
    [InlineData(UserRole.System)]
    public void Create_AllRoles_Succeeds(UserRole role)
    {
        var user = UserAccount.Create(Guid.NewGuid(), "ext", "e@e.com", "N", role);

        user.Role.Should().Be(role);
    }
}

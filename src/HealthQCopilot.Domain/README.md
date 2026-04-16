# HealthQCopilot.Domain

Shared domain layer containing all DDD primitives, aggregate roots, value objects, and domain events for every bounded context in the HealthQ Copilot platform.

## Why This Project Exists

Domain-Driven Design requires a clear separation between **domain logic** (business rules, invariants, state machines) and **infrastructure concerns** (databases, messaging, HTTP). This project is the single source of truth for all domain models — it has **zero infrastructure dependencies** and depends only on `MediatR.Contracts` for domain event definitions.

## Technology Choices

| Technology | Why |
|---|---|
| **MediatR.Contracts 2.0** | Provides `INotification` interface for domain events without pulling in MediatR's full handler pipeline — keeps the domain layer lean |
| **C# 13 / .NET 9** | Record types for value objects, required members, primary constructors for concise aggregate definitions |

## Structure

```
HealthQCopilot.Domain/
├── Primitives/            # Entity, AggregateRoot, ValueObject, Result<T>, IDomainEvent
├── Voice/                 # VoiceSession aggregate, AudioStream value object, events
├── Agents/                # TriageWorkflow aggregate, AgentDecision, events
├── Scheduling/            # Slot aggregate (reserve/book/release state machine), Booking
├── Ocr/                   # OcrJob aggregate (queue→process→complete/fail lifecycle)
├── PopulationHealth/      # PatientRisk aggregate, CareGap, OutreachCampaign
├── Notifications/         # OutreachCampaign (draft→active→complete/cancel), Message
└── Identity/              # UserAccount aggregate
```

## Key Patterns

- **AggregateRoot** — base class that collects domain events raised during a business operation, flushed to the outbox on save
- **Result\<T\>** — railway-oriented error handling; no exceptions for expected business failures
- **Value Objects** — immutable types with structural equality (e.g., `AudioStream`)
- **State Machines** — aggregates enforce valid state transitions (e.g., Slot: Available → Reserved → Booked, OcrJob: Queued → Processing → Complete/Failed)

## Environment Configuration

This project is a class library with no runtime configuration. It is referenced by all microservices and test projects.

| Environment | Notes |
|---|---|
| **Local / Aspire** | Referenced automatically via project dependencies |
| **Docker / K8s** | Compiled into each service's container image |
| **CI/CD** | Built as part of `dotnet build HealthQCopilot.sln` |

## Usage

```csharp
// Reference from any microservice .csproj
<ProjectReference Include="..\HealthQCopilot.Domain\HealthQCopilot.Domain.csproj" />

// Use domain primitives
public class MyAggregate : AggregateRoot
{
    public void DoSomething()
    {
        RaiseDomainEvent(new SomethingHappened(Id));
    }
}
```

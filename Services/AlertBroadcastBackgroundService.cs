using FYP_Project_II.Data;
using FYP_Project_II.Models;
using Microsoft.EntityFrameworkCore;

namespace FYP_Project_II.Services;

public class AlertBroadcastBackgroundService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<AlertBroadcastBackgroundService> _logger;
    private static readonly TimeSpan CheckInterval = TimeSpan.FromSeconds(30);

    public AlertBroadcastBackgroundService(IServiceProvider services, ILogger<AlertBroadcastBackgroundService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var now = DateTime.UtcNow;
                var due = await db.Alerts
                    .Where(a => a.Status == "Scheduled" && a.ScheduledFor.HasValue && a.ScheduledFor.Value <= now)
                    .ToListAsync(stoppingToken);

                foreach (var alert in due)
                {
                    alert.Status = "Sent";
                    alert.SentAt = now;
                    alert.ScheduledFor = null;
                    alert.UpdatedAt = now;
                    _logger.LogInformation("Auto-broadcast alert {AlertId}: {Title}", alert.AlertId, alert.Title);
                }

                if (due.Count > 0)
                {
                    await db.SaveChangesAsync(stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AlertBroadcastBackgroundService");
            }

            await Task.Delay(CheckInterval, stoppingToken);
        }
    }
}

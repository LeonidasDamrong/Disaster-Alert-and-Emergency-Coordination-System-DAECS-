namespace FYP_Project_II.Services;

/// <summary>
/// Sends FCM push notifications for alerts. When configuration is missing, operations no-op and do not throw.
/// </summary>
public interface IFcmSender
{
    /// <summary>
    /// Sends a push to topic "alerts" with data.alertId and optional notification title/body.
    /// Does not throw; logs errors only.
    /// </summary>
    Task SendAlertPushAsync(string alertId, string title, string message, CancellationToken cancellationToken = default);
}

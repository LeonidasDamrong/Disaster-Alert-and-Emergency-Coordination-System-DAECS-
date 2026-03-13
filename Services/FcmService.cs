using System.Net.Http.Json;
using System.Text;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Options;

namespace FYP_Project_II.Services;

/// <summary>
/// Sends FCM HTTP v1 push notifications using a Google service account.
/// Configuration: Firebase:ProjectId, and either Firebase:ServiceAccountJsonPath or Firebase:ServiceAccountJson.
/// </summary>
public class FcmService : IFcmSender
{
    private const string FcmScope = "https://www.googleapis.com/auth/firebase.messaging";
    private const string FcmSendUrlTemplate = "https://fcm.googleapis.com/v1/projects/{0}/messages:send";

    private readonly HttpClient _httpClient;
    private readonly ILogger<FcmService> _logger;
    private readonly FirebaseOptions _options;
    private GoogleCredential? _credential;
    private readonly SemaphoreSlim _credentialLock = new(1, 1);

    public FcmService(HttpClient httpClient, IOptions<FirebaseOptions> options, ILogger<FcmService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _options = options?.Value ?? new FirebaseOptions();
    }

    private async Task<GoogleCredential?> GetCredentialAsync(CancellationToken cancellationToken)
    {
        if (_credential != null)
            return _credential;

        await _credentialLock.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            if (_credential != null)
                return _credential;

            if (string.IsNullOrWhiteSpace(_options.ProjectId))
            {
                _logger.LogWarning("FCM: Firebase:ProjectId is not set; push notifications disabled.");
                return null;
            }

            try
            {
                if (!string.IsNullOrWhiteSpace(_options.ServiceAccountJsonPath) && File.Exists(_options.ServiceAccountJsonPath))
                {
                    _credential = GoogleCredential.FromFile(_options.ServiceAccountJsonPath).CreateScoped(FcmScope);
                    _logger.LogInformation("FCM: Loaded credentials from file {Path}", _options.ServiceAccountJsonPath);
                }
                else if (!string.IsNullOrWhiteSpace(_options.ServiceAccountJson))
                {
                    var json = Encoding.UTF8.GetBytes(_options.ServiceAccountJson);
                    using var stream = new MemoryStream(json);
                    _credential = GoogleCredential.FromStream(stream).CreateScoped(FcmScope);
                    _logger.LogInformation("FCM: Loaded credentials from Firebase:ServiceAccountJson.");
                }
                else
                {
                    _logger.LogWarning("FCM: Neither Firebase:ServiceAccountJsonPath nor Firebase:ServiceAccountJson is set; push notifications disabled.");
                    return null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "FCM: Failed to load service account credentials.");
                return null;
            }

            return _credential;
        }
        finally
        {
            _credentialLock.Release();
        }
    }

    public async Task SendAlertPushAsync(string alertId, string title, string message, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(alertId))
            return;

        var credential = await GetCredentialAsync(cancellationToken).ConfigureAwait(false);
        if (credential == null)
            return;

        string? accessToken;
        try
        {
            if (credential.UnderlyingCredential is Google.Apis.Auth.OAuth2.ServiceAccountCredential sac)
                accessToken = await sac.GetAccessTokenForRequestAsync(cancellationToken: cancellationToken).ConfigureAwait(false);
            else
                accessToken = await (credential as Google.Apis.Auth.OAuth2.ITokenAccess)!.GetAccessTokenForRequestAsync(cancellationToken: cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "FCM: Failed to obtain access token for alert {AlertId}.", alertId);
            return;
        }

        if (string.IsNullOrEmpty(accessToken))
        {
            _logger.LogError("FCM: Access token was null for alert {AlertId}.", alertId);
            return;
        }

        var body = new
        {
            message = new
            {
                topic = "alerts",
                data = new Dictionary<string, string> { { "alertId", alertId } },
                notification = new
                {
                    title = "New alert",
                    body = TruncateBody(title, message, 80)
                }
            }
        };

        var url = string.Format(FcmSendUrlTemplate, _options.ProjectId);
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.TryAddWithoutValidation("Authorization", "Bearer " + accessToken);
        request.Content = JsonContent.Create(body);

        try
        {
            var response = await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
                _logger.LogError("FCM: Send failed for alert {AlertId}. Status: {Status}, Response: {Response}", alertId, response.StatusCode, content);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "FCM: Request failed for alert {AlertId}.", alertId);
        }
    }

    private static string TruncateBody(string title, string message, int maxLen)
    {
        var preferred = !string.IsNullOrWhiteSpace(title) ? title.Trim() : message?.Trim() ?? "";
        if (string.IsNullOrEmpty(preferred))
            return "New alert";
        if (preferred.Length <= maxLen)
            return preferred;
        return preferred[..maxLen] + "...";
    }
}

/// <summary>
/// Configuration for FCM. Set in appsettings or Azure App Service / Key Vault.
/// Keys: Firebase:ProjectId, Firebase:ServiceAccountJsonPath (path to JSON file), Firebase:ServiceAccountJson (JSON string).
/// </summary>
public class FirebaseOptions
{
    public const string SectionName = "Firebase";

    public string ProjectId { get; set; } = "";
    public string? ServiceAccountJsonPath { get; set; }
    public string? ServiceAccountJson { get; set; }
}

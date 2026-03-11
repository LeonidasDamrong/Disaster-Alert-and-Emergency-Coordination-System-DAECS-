using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FYP_Project_II.Hubs
{
    /// <summary>
    /// SignalR hub for broadcasting announcements and alerts to all connected users.
    /// Clients receive AnnouncementCreated and AlertBroadcast; creator is identified via createdBy for different UI.
    /// </summary>
    [Authorize]
    public class NotificationHub : Hub
    {
    }
}

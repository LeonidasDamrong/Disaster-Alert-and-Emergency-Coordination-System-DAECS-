using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FYP_Project_II.Hubs
{
    /// <summary>
    /// SignalR hub for real-time SOS monitoring updates.
    /// Clients receive SOSReceived (new SOS from mobile) and SOSUpdated (status/urgency changes).
    /// </summary>
    [Authorize]
    public class SOSHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "SOSMonitoring");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "SOSMonitoring");
            await base.OnDisconnectedAsync(exception);
        }
    }
}

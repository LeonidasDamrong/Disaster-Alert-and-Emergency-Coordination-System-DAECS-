using Microsoft.AspNetCore.SignalR;

namespace FYP_Project_II.Hubs
{
    /// <summary>
    /// SignalR hub for real-time SOS monitoring updates.
    /// Clients receive SOSReceived (new SOS from mobile) and SOSUpdated (status/urgency changes).
    /// </summary>
    public class SOSHub : Hub
    {
        public const string RespondersGroup = "SOSResponders";

        public override async Task OnConnectedAsync()
        {
            // Hub is intentionally anonymous for early API testing.
            // Only authenticated users with the "First Responder" role are added to the responders group
            // so broadcasts can target responders only.
            if (Context.User?.Identity?.IsAuthenticated == true &&
                (Context.User.IsInRole("First Responder") || Context.User.IsInRole("Responder")))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, RespondersGroup);
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, RespondersGroup);
            await base.OnDisconnectedAsync(exception);
        }
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FYP_Project_II.Hubs
{
    /// <summary>
    /// SignalR hub for high-priority resource request notifications.
    /// Resource Managers receive ResourceRequestCritical events.
    /// </summary>
    [Authorize]
    public class ResourceHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            if (Context.User?.IsInRole("Resource Manager") == true)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "ResourceManagers");
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "ResourceManagers");
            await base.OnDisconnectedAsync(exception);
        }
    }
}


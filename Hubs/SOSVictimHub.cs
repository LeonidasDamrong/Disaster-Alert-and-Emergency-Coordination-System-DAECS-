using FYP_Project_II.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace FYP_Project_II.Hubs
{
    /// <summary>
    /// Anonymous SignalR hub for mobile victims to subscribe to their specific SOS updates.
    /// Clients must join a per-SOS group using a tracking token returned from POST /api/sos.
    /// </summary>
    [AllowAnonymous]
    public class SOSVictimHub : Hub
    {
        public const string VictimGroupPrefix = "sos:";
        private readonly ApplicationDbContext _db;

        public SOSVictimHub(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task JoinVictimSos(string sosId, string trackingToken)
        {
            if (string.IsNullOrWhiteSpace(sosId) || string.IsNullOrWhiteSpace(trackingToken))
                throw new HubException("Invalid SOS subscription request.");

            var token = trackingToken.Trim();
            var exists = await _db.SOSRequests
                .AsNoTracking()
                .AnyAsync(s => s.SOSRequestId == sosId && s.TrackingToken == token);

            if (!exists)
                throw new HubException("Invalid tracking token.");

            await Groups.AddToGroupAsync(Context.ConnectionId, VictimGroupPrefix + sosId);
        }
    }
}


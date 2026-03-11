import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, Home, Package, Radio, Activity } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  announcementApi,
  sosApi,
  alertApi,
  shelterApi,
  resourceApi,
} from '../lib/api';
import type { Announcement, Shelter } from '../lib/types';
import { useNotificationSignalR } from '../hooks/useNotificationSignalR';

type SOSItem = {
  id: string;
  victimName: string;
  location: string;
  description: string;
  urgency: string;
  status: string;
  assignedResponder?: string;
  createdAt: string;
};
type AlertItem = { id: string; title: string; message: string; status: string; createdAt: string };
type ResourceRequestItem = {
  resourceRequestId: string;
  itemName: string;
  quantity: number;
  unit: string;
  urgency: string;
  status: string;
  requestedAt: string;
};

const URGENCY_COLORS: Record<string, string> = {
  Critical: '#DC2626',
  High: '#EA580C',
  Medium: '#F59E0B',
  Low: '#10B981',
};

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [sosList, setSosList] = useState<SOSItem[]>([]);
  const [alertsList, setAlertsList] = useState<AlertItem[]>([]);
  const [sheltersList, setSheltersList] = useState<Shelter[]>([]);
  const [myShelter, setMyShelter] = useState<Shelter | null>(null);
  const [resourceRequests, setResourceRequests] = useState<ResourceRequestItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const role = user?.role;
  const isAdmin = role === 'Admin' || role === 'System Admin';
  const isFirstResponder = role === 'First Responder';
  const isShelterManager = role === 'Shelter Manager';
  const isResourceManager = role === 'Resource Manager';

  // Announcements (all roles)
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingAnnouncements(true);
        const data = await announcementApi.getAll();
        setAnnouncements(data);
      } catch (err) {
        console.error('Failed to load announcements', err);
      } finally {
        setLoadingAnnouncements(false);
      }
    };
    load();
  }, []);

  // Role-based dashboard data (exclude Disaster Manager)
  useEffect(() => {
    if (!role || role === 'Disaster Manager') {
      setLoadingData(false);
      return;
    }
    const load = async () => {
      setLoadingData(true);
      try {
        const promises: Promise<unknown>[] = [];

        if (isAdmin || isFirstResponder) {
          promises.push(sosApi.getAll().then(setSosList).catch(() => setSosList([])));
        }
        if (isAdmin || isFirstResponder || isShelterManager || isResourceManager) {
          promises.push(alertApi.getAll().then(setAlertsList).catch(() => setAlertsList([])));
        }
        if (isAdmin) {
          promises.push(shelterApi.getAll().then(setSheltersList).catch(() => setSheltersList([])));
        }
        if (isShelterManager) {
          promises.push(shelterApi.getMyShelter().then(setMyShelter).catch(() => setMyShelter(null)));
        }
        if (isAdmin || isResourceManager) {
          promises.push(
            resourceApi.getResourceRequests(undefined, false).then(setResourceRequests).catch(() => setResourceRequests([]))
          );
        }

        await Promise.all(promises);
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [role, isAdmin, isFirstResponder, isShelterManager, isResourceManager]);

  useNotificationSignalR(
    (payload) => {
      setAnnouncements((prev) => {
        if (prev.some((a) => a.id === payload.id)) return prev;
        const createdAt = payload.createdAt || new Date().toISOString();
        const newItem: Announcement = {
          id: payload.id,
          title: payload.title,
          content: payload.content,
          priority: (payload.priority as 'Low' | 'Medium' | 'High') ?? 'Low',
          isActive: true,
          createdBy: payload.createdBy,
          createdAt,
        };
        return [newItem, ...prev];
      });
    },
    undefined,
    !!user
  );

  const recentAnnouncements = useMemo(() => announcements.slice(0, 5), [announcements]);

  // Stats by role (real data)
  const stats = useMemo(() => {
    const list: Array<{
      icon: typeof Radio;
      label: string;
      value: number | string;
      bgColor: string;
      iconColor: string;
      change?: string;
    }> = [];
    if (isAdmin || isFirstResponder) {
      const activeSOS = sosList.filter((s) => s.status !== 'Completed');
      list.push({
        icon: Radio,
        label: 'Active SOS',
        value: activeSOS.length,
        bgColor: 'bg-red-100',
        iconColor: 'text-red-600',
        change: `${sosList.filter((s) => s.urgency === 'Critical' && s.status !== 'Completed').length} critical`,
      });
    }
    if (isAdmin || isFirstResponder || isShelterManager || isResourceManager) {
      const sentAlerts = alertsList.filter((a) => a.status === 'Sent');
      list.push({
        icon: AlertTriangle,
        label: 'Alerts Sent',
        value: sentAlerts.length,
        bgColor: 'bg-orange-100',
        iconColor: 'text-orange-600',
        change: sentAlerts.length ? 'Latest broadcast' : 'None sent',
      });
    }
    if (isAdmin) {
      const openShelters = sheltersList.filter((s) => s.status === 'Open');
      const totalEvacuees = sheltersList.reduce((sum, s) => sum + s.currentOccupancy, 0);
      list.push({
        icon: Home,
        label: 'Open Shelters',
        value: openShelters.length,
        bgColor: 'bg-blue-100',
        iconColor: 'text-blue-600',
        change: `${totalEvacuees} evacuees`,
      });
      const pendingReqs = resourceRequests.filter((r) => r.status === 'Pending');
      const criticalReqs = pendingReqs.filter((r) => r.urgency === 'Critical' || r.urgency === 'High');
      list.push({
        icon: Package,
        label: 'Pending Requests',
        value: pendingReqs.length,
        bgColor: 'bg-purple-100',
        iconColor: 'text-purple-600',
        change: criticalReqs.length ? `${criticalReqs.length} critical/high` : '—',
      });
    }
    if (isShelterManager && myShelter) {
      list.push({
        icon: Home,
        label: 'My Shelter',
        value: myShelter.name,
        bgColor: 'bg-blue-100',
        iconColor: 'text-blue-600',
        change: `${myShelter.currentOccupancy}/${myShelter.TotalCapacity} occupied`,
      });
    }
    if (isResourceManager) {
      const pendingReqs = resourceRequests.filter((r) => r.status === 'Pending');
      const criticalReqs = pendingReqs.filter((r) => r.urgency === 'Critical' || r.urgency === 'High');
      list.push({
        icon: Package,
        label: 'Pending Requests',
        value: pendingReqs.length,
        bgColor: 'bg-purple-100',
        iconColor: 'text-purple-600',
        change: criticalReqs.length ? `${criticalReqs.length} critical/high` : '—',
      });
    }
    return list;
  }, [
    role,
    isAdmin,
    isFirstResponder,
    isShelterManager,
    isResourceManager,
    sosList,
    alertsList,
    sheltersList,
    myShelter,
    resourceRequests,
  ]);

  // SOS by urgency (Admin, First Responder)
  const sosUrgencyData = useMemo(() => {
    if (!sosList.length) return [];
    const active = sosList.filter((s) => s.status !== 'Completed');
    const levels = ['Critical', 'High', 'Medium', 'Low'];
    return levels.map((name) => ({
      name,
      value: active.filter((s) => s.urgency === name).length,
      color: URGENCY_COLORS[name] || '#6B7280',
    })).filter((d) => d.value > 0);
  }, [sosList]);

  // Shelter occupancy (Admin: all; Shelter Manager: my shelter)
  const shelterChartData = useMemo(() => {
    if (isAdmin && sheltersList.length > 0) {
      return sheltersList.map((s) => ({
        name: s.name.split(' ').slice(0, 3).join(' ') || s.name,
        occupancy: s.currentOccupancy,
        available: s.TotalCapacity - s.currentOccupancy,
      }));
    }
    if (isShelterManager && myShelter) {
      return [
        {
          name: myShelter.name,
          occupancy: myShelter.currentOccupancy,
          available: myShelter.TotalCapacity - myShelter.currentOccupancy,
        },
      ];
    }
    return [];
  }, [isAdmin, isShelterManager, sheltersList, myShelter]);

  // Pending requests by urgency (Admin, Resource Manager)
  const requestsByUrgencyData = useMemo(() => {
    const pending = resourceRequests.filter((r) => r.status === 'Pending');
    if (pending.length === 0) return [];
    const levels = ['Critical', 'High', 'Medium', 'Low'];
    return levels.map((name) => ({
      name,
      value: pending.filter((r) => r.urgency === name).length,
      color: URGENCY_COLORS[name] || '#6B7280',
    })).filter((d) => d.value > 0);
  }, [resourceRequests]);

  // Recent SOS (Admin, First Responder)
  const recentSOS = useMemo(
    () => [...sosList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [sosList]
  );

  // Recent resource requests (Admin, Resource Manager)
  const recentRequests = useMemo(
    () =>
      [...resourceRequests]
        .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
        .slice(0, 5),
    [resourceRequests]
  );

  const showSOSCharts = (isAdmin || isFirstResponder) && sosList.length > 0;
  const showShelterChart = shelterChartData.length > 0;
  const showRequestsChart = (isAdmin || isResourceManager) && requestsByUrgencyData.length > 0;
  const showRecentSOS = (isAdmin || isFirstResponder) && recentSOS.length > 0;
  const showRecentRequests = (isAdmin || isResourceManager) && recentRequests.length > 0;

  const isCompactLayout = isFirstResponder || isShelterManager || isResourceManager;

  const announcementsCard = (
    <Card className={isCompactLayout ? 'h-full flex flex-col min-h-0' : ''}>
      <CardHeader className={isCompactLayout ? 'py-3 px-4' : ''}>
        <CardTitle className={isCompactLayout ? 'text-base' : ''}>Announcements</CardTitle>
        <CardDescription className={isCompactLayout ? 'text-xs' : ''}>
          Latest system-wide messages
        </CardDescription>
      </CardHeader>
      <CardContent className={isCompactLayout ? 'py-2 px-4 flex-1 min-h-0' : ''}>
        {loadingAnnouncements && announcements.length === 0 ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : recentAnnouncements.length === 0 ? (
          <p className="text-sm text-gray-500">No announcements.</p>
        ) : (
          <div
            className={
              isCompactLayout
                ? 'max-h-[calc(100vh-14rem)] overflow-y-auto overflow-x-hidden pr-1 scrollbar-dialog'
                : 'max-h-[70vh] overflow-y-auto overflow-x-hidden pr-1 scrollbar-dialog'
            }
          >
            <div className={isCompactLayout ? 'space-y-2' : 'space-y-3'}>
              {(isCompactLayout ? recentAnnouncements.slice(0, 5) : recentAnnouncements).map((a) => (
                <div
                  key={a.id}
                  className={
                    isCompactLayout
                      ? 'p-2 border rounded-md'
                      : 'p-3 border rounded-lg flex items-start justify-between gap-3'
                  }
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={isCompactLayout ? 'font-medium text-sm' : 'font-semibold'}>{a.title}</p>
                      <Badge
                        className={
                          a.priority === 'High'
                            ? 'bg-red-100 text-red-800 text-[10px]'
                            : a.priority === 'Medium'
                              ? 'bg-yellow-100 text-yellow-800 text-[10px]'
                              : 'bg-blue-100 text-blue-800 text-[10px]'
                        }
                      >
                        {a.priority}
                      </Badge>
                    </div>
                    <p className={`text-gray-600 mt-0.5 ${isCompactLayout ? 'text-xs line-clamp-2' : 'text-sm mt-1'}`}>
                      {a.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      By {a.createdBy} • {new Date(a.createdAt).toLocaleString('en-MY', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const mainContent = (
    <>
      {/* Stats – role-based */}
      {(isAdmin || isFirstResponder || isShelterManager || isResourceManager) && (
        <>
          {loadingData && stats.length === 0 ? (
            <p className="text-sm text-gray-500">Loading dashboard stats...</p>
          ) : stats.length > 0 ? (
            <div
              className={
                isCompactLayout
                  ? 'grid grid-cols-2 gap-3'
                  : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
              }
            >
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className={isCompactLayout ? 'p-4' : 'p-6'}>
                    <div className="flex items-center justify-between">
                      <div className={`rounded-lg ${stat.bgColor} ${isCompactLayout ? 'p-2' : 'p-3'}`}>
                        <stat.icon className={`${stat.iconColor} ${isCompactLayout ? 'h-5 w-5' : 'h-6 w-6'}`} />
                      </div>
                      {stat.change != null && (
                        <Badge variant="outline" className="text-xs">
                          {stat.change}
                        </Badge>
                      )}
                    </div>
                    <div className={isCompactLayout ? 'mt-2' : 'mt-4'}>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className={`font-bold mt-1 ${isCompactLayout ? 'text-xl' : 'text-3xl'}`}>{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </>
      )}

      {/* Charts row */}
      <div className={isCompactLayout ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}>
        {showSOSCharts && (
          <Card>
            <CardHeader className={isCompactLayout ? 'py-3 px-4' : ''}>
              <CardTitle className={isCompactLayout ? 'text-base' : ''}>SOS by Urgency</CardTitle>
              <CardDescription className={isCompactLayout ? 'text-xs' : ''}>
                Active emergency requests
              </CardDescription>
            </CardHeader>
            <CardContent className={isCompactLayout ? 'px-4 pb-4' : ''}>
              {sosUrgencyData.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">No active SOS requests.</p>
              ) : (
                <ResponsiveContainer width="100%" height={isCompactLayout ? 220 : 300}>
                  <PieChart>
                    <Pie
                      data={sosUrgencyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sosUrgencyData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {showShelterChart && (
          <Card>
            <CardHeader className={isCompactLayout ? 'py-3 px-4' : ''}>
              <CardTitle className={isCompactLayout ? 'text-base' : ''}>Shelter Occupancy</CardTitle>
              <CardDescription className={isCompactLayout ? 'text-xs' : ''}>
                {isShelterManager ? 'Your shelter' : 'Capacity utilization'}
              </CardDescription>
            </CardHeader>
            <CardContent className={isCompactLayout ? 'px-4 pb-4' : ''}>
              <ResponsiveContainer width="100%" height={isCompactLayout ? 220 : 300}>
                <BarChart data={shelterChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={shelterChartData.length > 2 ? -15 : 0} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="occupancy" fill="#DC2626" name="Occupied" />
                  <Bar dataKey="available" fill="#10B981" name="Available" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {showRequestsChart && (
          <Card>
            <CardHeader className={isCompactLayout ? 'py-3 px-4' : ''}>
              <CardTitle className={isCompactLayout ? 'text-base' : ''}>Pending by Urgency</CardTitle>
              <CardDescription className={isCompactLayout ? 'text-xs' : ''}>
                Requests awaiting action
              </CardDescription>
            </CardHeader>
            <CardContent className={isCompactLayout ? 'px-4 pb-4' : ''}>
              <ResponsiveContainer width="100%" height={isCompactLayout ? 220 : 300}>
                <PieChart>
                  <Pie
                    data={requestsByUrgencyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {requestsByUrgencyData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity – SOS (Admin, First Responder) */}
      {showRecentSOS && (
        <Card>
          <CardHeader className={isCompactLayout ? 'py-3 px-4' : ''}>
            <CardTitle className={`flex items-center gap-2 ${isCompactLayout ? 'text-base' : ''}`}>
              <Activity className="h-5 w-5" />
              Recent SOS Activity
            </CardTitle>
            <CardDescription className={isCompactLayout ? 'text-xs' : ''}>
              Latest emergency requests
            </CardDescription>
          </CardHeader>
          <CardContent className={isCompactLayout ? 'px-4 pb-4' : ''}>
            <div className={isCompactLayout ? 'space-y-2' : 'space-y-4'}>
              {(isCompactLayout ? recentSOS.slice(0, 3) : recentSOS).map((sos) => (
                <div
                  key={sos.id}
                  className={`flex items-start justify-between border rounded-lg hover:bg-gray-50 cursor-pointer ${
                    isCompactLayout ? 'p-2' : 'p-4'
                  }`}
                  onClick={() => navigate('/sos')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate('/sos')}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded ${
                        sos.urgency === 'Critical'
                          ? 'bg-red-100 text-red-600'
                          : sos.urgency === 'High'
                            ? 'bg-orange-100 text-orange-600'
                            : sos.urgency === 'Medium'
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-green-100 text-green-600'
                      }`}
                    >
                      <Radio className="h-4 w-4" />
                    </div>
                    <div>
                      <p className={isCompactLayout ? 'font-medium text-sm' : 'font-semibold'}>{sos.victimName}</p>
                      <p className="text-sm text-gray-600">{sos.location}</p>
                      {!isCompactLayout && sos.description && (
                        <p className="text-xs text-gray-500 mt-1">{sos.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        sos.status === 'New' ? 'destructive' : sos.status === 'In Progress' ? 'default' : 'secondary'
                      }
                      className={isCompactLayout ? 'text-[10px]' : ''}
                    >
                      {sos.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(sos.createdAt).toLocaleTimeString('en-MY')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className={isCompactLayout ? 'mt-2' : 'mt-3'}>
              <Link to="/sos">
                <Button variant="outline" size="sm" className={isCompactLayout ? 'h-8 text-xs' : ''}>
                  View all SOS
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Resource Requests (Admin, Resource Manager) */}
      {showRecentRequests && (
        <Card>
          <CardHeader className={isCompactLayout ? 'py-3 px-4' : ''}>
            <CardTitle className={`flex items-center gap-2 ${isCompactLayout ? 'text-base' : ''}`}>
              <Package className="h-5 w-5" />
              Recent Resource Requests
            </CardTitle>
            <CardDescription className={isCompactLayout ? 'text-xs' : ''}>
              Latest requests for resources
            </CardDescription>
          </CardHeader>
          <CardContent className={isCompactLayout ? 'px-4 pb-4' : ''}>
            <div className={isCompactLayout ? 'space-y-2' : 'space-y-4'}>
              {(isCompactLayout ? recentRequests.slice(0, 3) : recentRequests).map((req) => (
                <div
                  key={req.resourceRequestId}
                  className={`flex items-start justify-between border rounded-lg hover:bg-gray-50 cursor-pointer ${
                    isCompactLayout ? 'p-2' : 'p-4'
                  }`}
                  onClick={() => navigate('/resources')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate('/resources')}
                >
                  <div>
                    <p className={isCompactLayout ? 'font-medium text-sm' : 'font-semibold'}>{req.itemName}</p>
                    <p className="text-sm text-gray-600">
                      {req.quantity} {req.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={`${
                        req.urgency === 'Critical'
                          ? 'bg-red-100 text-red-800'
                          : req.urgency === 'High'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                      } ${isCompactLayout ? 'text-[10px]' : ''}`}
                    >
                      {req.urgency}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{req.status}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(req.requestedAt).toLocaleTimeString('en-MY')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className={isCompactLayout ? 'mt-2' : 'mt-3'}>
              <Link to="/resources">
                <Button variant="outline" size="sm" className={isCompactLayout ? 'h-8 text-xs' : ''}>
                  View all requests
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disaster Manager or no role: minimal view */}
      {role === 'Disaster Manager' && (
        <Card>
          <CardContent className="py-6">
            <p className="text-gray-600">
              Use the Alerts and Resource Management sections from the sidebar for your tasks.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );

  return (
    <div className={isCompactLayout ? 'flex flex-col gap-4 flex-1 min-h-0' : 'space-y-6'}>
      <div className="shrink-0">
        <h2 className={`font-bold text-gray-900 ${isCompactLayout ? 'text-xl' : 'text-3xl'}`}>
          Welcome, {user?.name}
        </h2>
        <p className="text-gray-600 text-sm">
          Emergency Response Dashboard -{' '}
          {new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      {isCompactLayout ? (
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-[calc(100vh-10rem)]">
          <aside className="w-full lg:w-80 shrink-0 flex flex-col min-h-0 lg:min-h-full">
            {announcementsCard}
          </aside>
          <div className="flex-1 min-w-0 space-y-4">
            {mainContent}
          </div>
        </div>
      ) : (
        <>
          {announcementsCard}
          {mainContent}
        </>
      )}
    </div>
  );
};

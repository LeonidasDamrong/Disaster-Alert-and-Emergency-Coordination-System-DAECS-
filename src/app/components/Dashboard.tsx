import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, Users, Home, Package, Radio, Activity } from 'lucide-react';
import { Badge } from './ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { mockSOSRequests, mockAlerts, mockShelters, mockResourceRequests } from '../lib/mockData';

export const Dashboard = () => {
  const { user } = useAuth();

  // Statistics
  const stats = [
    {
      icon: Radio,
      label: 'Active SOS',
      value: mockSOSRequests.filter(s => s.status !== 'Completed').length,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
      change: '+2 today'
    },
    {
      icon: AlertTriangle,
      label: 'Active Alerts',
      value: mockAlerts.filter(a => a.status === 'Sent').length,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      change: '3 sent today'
    },
    {
      icon: Home,
      label: 'Open Shelters',
      value: mockShelters.filter(s => s.status === 'Open').length,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      change: `${mockShelters.reduce((sum, s) => sum + s.currentOccupancy, 0)} evacuees`
    },
    {
      icon: Package,
      label: 'Pending Requests',
      value: mockResourceRequests.filter(r => r.status === 'Pending').length,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      change: '1 critical'
    }
  ];

  // SOS by urgency chart data
  const sosUrgencyData = [
    { name: 'Critical', value: mockSOSRequests.filter(s => s.urgency === 'Critical' && s.status !== 'Completed').length, color: '#DC2626' },
    { name: 'High', value: mockSOSRequests.filter(s => s.urgency === 'High' && s.status !== 'Completed').length, color: '#EA580C' },
    { name: 'Medium', value: mockSOSRequests.filter(s => s.urgency === 'Medium' && s.status !== 'Completed').length, color: '#F59E0B' },
    { name: 'Low', value: mockSOSRequests.filter(s => s.urgency === 'Low' && s.status !== 'Completed').length, color: '#10B981' },
  ];

  // Shelter occupancy data
  const shelterData = mockShelters.map(s => ({
    name: s.name.split(' ').slice(0, 3).join(' '),
    occupancy: s.currentOccupancy,
    TotalCapacity: s.TotalCapacity,
    available: s.TotalCapacity - s.currentOccupancy
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Welcome, {user?.name}</h2>
        <p className="text-gray-600">Emergency Response Dashboard - {new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <Badge variant="outline" className="text-xs">{stat.change}</Badge>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SOS Urgency Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>SOS Requests by Urgency Level</CardTitle>
            <CardDescription>Active emergency requests distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
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
                  {sosUrgencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Shelter Occupancy */}
        <Card>
          <CardHeader>
            <CardTitle>Shelter Occupancy Status</CardTitle>
            <CardDescription>Current TotalCapacity utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={shelterData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="occupancy" fill="#DC2626" name="Occupied" />
                <Bar dataKey="available" fill="#10B981" name="Available" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockSOSRequests.slice(0, 3).map((sos) => (
              <div key={sos.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded ${
                    sos.urgency === 'Critical' ? 'bg-red-100 text-red-600' :
                    sos.urgency === 'High' ? 'bg-orange-100 text-orange-600' :
                    sos.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    <Radio className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">{sos.victimName}</p>
                    <p className="text-sm text-gray-600">{sos.location}</p>
                    <p className="text-xs text-gray-500 mt-1">{sos.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={
                    sos.status === 'New' ? 'destructive' :
                    sos.status === 'In Progress' ? 'default' :
                    'secondary'
                  }>
                    {sos.status}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(sos.createdAt).toLocaleTimeString('en-MY')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
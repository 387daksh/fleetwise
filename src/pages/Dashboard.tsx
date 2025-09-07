import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { 
  Train, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Wrench,
  TrendingUp,
  Calendar,
  Users
} from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { isLoading, isAuthenticated, user } = useAuth();
  
  const dashboardStats = useQuery(api.trainsets.getDashboardStats);
  const todayInductions = useQuery(api.inductionDecisions.getTodayInductions);
  const activeAlerts = useQuery(api.alerts.getActiveAlerts);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "standby": return "bg-yellow-100 text-yellow-800";
      case "maintenance": return "bg-blue-100 text-blue-800";
      case "out_of_service": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Train className="h-8 w-8 text-gray-900" />
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Kochi Metro</h1>
                <p className="text-sm text-gray-600">Trainset Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name || user?.email}</span>
              <Button variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Trainsets</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {dashboardStats?.total || 0}
                  </p>
                </div>
                <Train className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Service</p>
                  <p className="text-3xl font-semibold text-green-600">
                    {dashboardStats?.active || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Standby</p>
                  <p className="text-3xl font-semibold text-yellow-600">
                    {dashboardStats?.standby || 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Maintenance</p>
                  <p className="text-3xl font-semibold text-blue-600">
                    {dashboardStats?.maintenance || 0}
                  </p>
                </div>
                <Wrench className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="inductions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inductions">Today's Inductions</TabsTrigger>
            <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
            <TabsTrigger value="planning">Planning Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="inductions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Today's Induction Decisions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todayInductions && todayInductions.length > 0 ? (
                  <div className="space-y-4">
                    {todayInductions.map((induction) => (
                      <motion.div
                        key={induction._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
                            {induction.priority}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              Trainset {induction.trainset?.trainsetNumber}
                            </p>
                            <p className="text-sm text-gray-600">
                              {induction.reasoning}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(induction.decision)}>
                          {induction.decision.replace('_', ' ')}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No induction decisions for today</p>
                    <Button className="mt-4" variant="outline">
                      Generate Recommendations
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Active System Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeAlerts && activeAlerts.length > 0 ? (
                  <div className="space-y-4">
                    {activeAlerts.map((alert) => (
                      <motion.div
                        key={alert._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <span className="text-sm text-gray-600">{alert.type}</span>
                          </div>
                          <p className="font-medium text-gray-900 mb-1">{alert.title}</p>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                          {alert.trainset && (
                            <p className="text-xs text-gray-500 mt-1">
                              Trainset: {alert.trainset.trainsetNumber}
                            </p>
                          )}
                        </div>
                        <Button size="sm" variant="outline">
                          Resolve
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <p className="text-gray-600">No active alerts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="planning">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start" variant="outline">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Generate Induction Plan
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Wrench className="mr-2 h-4 w-4" />
                    Maintenance Scheduler
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Crew Assignment
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start" variant="outline">
                    Add New Trainset
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    Update Fitness Certificate
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    Create Maintenance Job
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

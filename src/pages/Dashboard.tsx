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
import { useMutation } from "convex/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

type NewTrainsetForm = {
  trainsetNumber: string;
  manufacturer: string;
  yearOfManufacture: string;
  currentLocation: string;
};

export default function Dashboard() {
  const { isLoading, isAuthenticated, user } = useAuth();
  
  const dashboardStats = useQuery(api.trainsets.getDashboardStats);
  const todayInductions = useQuery(api.inductionDecisions.getTodayInductions);
  const activeAlerts = useQuery(api.alerts.getActiveAlerts);

  // moved loading/auth gating after hooks to maintain consistent hook order

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

  const createTrainset = useMutation(api.trainsets.createTrainset);
  const bulkUpsertTrainsets = useMutation(api.trainsets.bulkUpsertTrainsets);
  const generateRecommendations = useMutation(api.inductionDecisions.generateInductionRecommendations);
  const saveInductionDecisions = useMutation(api.inductionDecisions.saveInductionDecisions);

  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const [newTrainset, setNewTrainset] = useState<NewTrainsetForm>({
    trainsetNumber: "",
    manufacturer: "",
    yearOfManufacture: "",
    currentLocation: "",
  });

  const [csvText, setCsvText] = useState("");

  // Auth gating moved here so all hooks above are always called in the same order
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

  const handleCreateTrainset = async () => {
    try {
      if (
        !newTrainset.trainsetNumber ||
        !newTrainset.manufacturer ||
        !newTrainset.yearOfManufacture ||
        !newTrainset.currentLocation
      ) {
        toast("Please fill all fields.");
        return;
      }
      await createTrainset({
        trainsetNumber: newTrainset.trainsetNumber.trim(),
        manufacturer: newTrainset.manufacturer.trim(),
        yearOfManufacture: Number(newTrainset.yearOfManufacture),
        currentLocation: newTrainset.currentLocation.trim(),
      });
      toast("Trainset created successfully.");
      setAddOpen(false);
      setNewTrainset({
        trainsetNumber: "",
        manufacturer: "",
        yearOfManufacture: "",
        currentLocation: "",
      });
    } catch (e: any) {
      toast(e?.message ?? "Failed to create trainset.");
    }
  };

  const handleGenerateRecommendations = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const recs = await generateRecommendations({ date: today });
      if (!recs || recs.length === 0) {
        toast("No recommendations generated.");
        return;
      }
      const decisions = recs.map((r: any, idx: number) => ({
        trainsetId: r.trainsetId,
        decision: r.decision,
        priority: r.priority ?? idx + 1,
        reasoning: r.reasoning ?? "",
        constraints: Array.isArray(r.constraints) ? r.constraints : [],
        conflictAlerts: Array.isArray(r.conflicts) ? r.conflicts : [],
      }));
      await saveInductionDecisions({ date: today, decisions });
      toast("Recommendations generated and saved for today.");
    } catch (e: any) {
      toast(e?.message ?? "Failed to generate recommendations.");
    }
  };

  const parseCsv = (text: string) => {
    // Expecting headers: trainsetNumber,manufacturer,yearOfManufacture,currentLocation,totalMileage,currentStatus,isActive
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return [];

    const header = lines[0].split(",").map((h) => h.trim());
    const idx = (key: string) => header.findIndex((h) => h.toLowerCase() === key.toLowerCase());

    const idxTrainsetNumber = idx("trainsetNumber");
    const idxManufacturer = idx("manufacturer");
    const idxYear = idx("yearOfManufacture");
    const idxLocation = idx("currentLocation");
    const idxMileage = idx("totalMileage");
    const idxStatus = idx("currentStatus");
    const idxActive = idx("isActive");

    const requiredMissing =
      idxTrainsetNumber === -1 || idxManufacturer === -1 || idxYear === -1 || idxLocation === -1;
    if (requiredMissing) {
      throw new Error(
        "CSV must include headers: trainsetNumber, manufacturer, yearOfManufacture, currentLocation",
      );
    }

    const rows: Array<{
      trainsetNumber: string;
      manufacturer: string;
      yearOfManufacture: number;
      currentLocation: string;
      totalMileage?: number;
      currentStatus?: string;
      isActive?: boolean;
    }> = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      const row = {
        trainsetNumber: cols[idxTrainsetNumber] ?? "",
        manufacturer: cols[idxManufacturer] ?? "",
        yearOfManufacture: Number(cols[idxYear] ?? ""),
        currentLocation: cols[idxLocation] ?? "",
        totalMileage: idxMileage !== -1 && cols[idxMileage] ? Number(cols[idxMileage]) : undefined,
        currentStatus: idxStatus !== -1 && cols[idxStatus] ? cols[idxStatus] : undefined,
        isActive:
          idxActive !== -1 && cols[idxActive]
            ? ["true", "1", "yes"].includes(cols[idxActive].toLowerCase())
            : undefined,
      };

      if (!row.trainsetNumber || !row.manufacturer || !row.yearOfManufacture || !row.currentLocation) {
        continue;
      }
      rows.push(row);
    }

    return rows;
  };

  const handleBulkUpload = async () => {
    try {
      const rows = parseCsv(csvText);
      if (rows.length === 0) {
        toast("No valid rows found in CSV.");
        return;
      }
      const result = await bulkUpsertTrainsets({ rows });
      const inserted = result.filter((r) => r.action === "inserted").length;
      const updated = result.filter((r) => r.action === "updated").length;
      toast(`Processed ${result.length} trainsets (${inserted} inserted, ${updated} updated).`);
      setBulkOpen(false);
      setCsvText("");
    } catch (e: any) {
      toast(e?.message ?? "Failed to process CSV.");
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
                    <Button className="mt-4" variant="outline" onClick={handleGenerateRecommendations}>
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
                  <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full justify-start" variant="outline">
                        Add New Trainset
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add Trainset</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                          <Label>Trainset Number</Label>
                          <Input
                            value={newTrainset.trainsetNumber}
                            onChange={(e) =>
                              setNewTrainset((s: NewTrainsetForm) => ({ ...s, trainsetNumber: e.target.value }))
                            }
                            placeholder="KM-001"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Manufacturer</Label>
                          <Input
                            value={newTrainset.manufacturer}
                            onChange={(e) => setNewTrainset((s: NewTrainsetForm) => ({ ...s, manufacturer: e.target.value }))}
                            placeholder="Alstom"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Year of Manufacture</Label>
                          <Input
                            type="number"
                            value={newTrainset.yearOfManufacture}
                            onChange={(e) =>
                              setNewTrainset((s: NewTrainsetForm) => ({ ...s, yearOfManufacture: e.target.value }))
                            }
                            placeholder="2019"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Current Location</Label>
                          <Input
                            value={newTrainset.currentLocation}
                            onChange={(e) =>
                              setNewTrainset((s: NewTrainsetForm) => ({ ...s, currentLocation: e.target.value }))
                            }
                            placeholder="Aluva Depot"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateTrainset}>Create</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full justify-start" variant="outline">
                        Bulk Upload Trainsets (CSV)
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Bulk Upload via CSV</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          Export your Excel as CSV and paste here. Required headers:
                          trainsetNumber, manufacturer, yearOfManufacture, currentLocation
                          Optional: totalMileage, currentStatus (active|standby|maintenance|out_of_service), isActive
                        </p>
                        <div className="rounded-md border">
                          <textarea
                            className="w-full h-60 p-3 outline-none bg-white"
                            placeholder={`trainsetNumber,manufacturer,yearOfManufacture,currentLocation,totalMileage,currentStatus,isActive
KM-026,Alstom,2019,Aluva Depot,75000,active,true
KM-027,BEML,2020,Petta Depot,52000,standby,true`}
                            value={csvText}
                            onChange={(e) => setCsvText(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setBulkOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleBulkUpload}>Process CSV</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

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
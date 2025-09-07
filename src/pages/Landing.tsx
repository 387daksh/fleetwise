import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Train, 
  Shield, 
  TrendingUp, 
  Clock, 
  Users, 
  CheckCircle,
  ArrowRight,
  Zap,
  BarChart3
} from "lucide-react";
import { useNavigate } from "react-router";

export default function Landing() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: "Real-time Monitoring",
      description: "Track fitness certificates, job cards, and maintenance status across all 25 trainsets in real-time."
    },
    {
      icon: TrendingUp,
      title: "AI-Powered Optimization",
      description: "Machine learning algorithms optimize daily induction decisions for maximum fleet availability and cost efficiency."
    },
    {
      icon: Clock,
      title: "Automated Scheduling",
      description: "Eliminate manual reconciliation with automated scheduling that considers all operational constraints."
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Comprehensive dashboards and reports to track KPIs, maintenance costs, and operational efficiency."
    }
  ];

  const stats = [
    { label: "Fleet Availability", value: "99.5%", icon: CheckCircle },
    { label: "Cost Reduction", value: "25%", icon: TrendingUp },
    { label: "Planning Time", value: "80% Less", icon: Clock },
    { label: "Trainsets Managed", value: "25+", icon: Train }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Train className="h-8 w-8 text-gray-900" />
              <span className="text-xl font-semibold text-gray-900">Kochi Metro TMS</span>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-gray-600">Welcome, {user?.name || user?.email}</span>
                  <Button onClick={() => navigate("/dashboard")}>
                    Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button onClick={() => navigate("/auth")}>
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-8 leading-tight">
              Intelligent Trainset
              <br />
              <span className="text-gray-600">Management System</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Transform your fleet operations with AI-powered decision support. 
              Optimize daily induction planning, reduce maintenance costs, and achieve 
              99.5% punctuality through data-driven insights.
            </p>
            <div className="flex items-center justify-center space-x-6">
              <Button 
                size="lg" 
                className="px-8 py-4 text-lg"
                onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
              >
                {isAuthenticated ? "Go to Dashboard" : "Start Free Trial"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                Watch Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-8 w-8 text-gray-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Everything you need to optimize your fleet
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform integrates all aspects of trainset management 
              into a single, intelligent system.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-none">
                  <CardContent className="p-8">
                    <feature.icon className="h-12 w-12 text-gray-600 mb-6" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">
              Solving Complex Fleet Management Challenges
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Current Challenges</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    Manual reconciliation in 2-hour window (21:00-23:00 IST)
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    Siloed data across spreadsheets and WhatsApp
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    Risk of missing fitness certificates
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    Uneven mileage distribution
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Our Solution</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    Automated data integration from all sources
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    AI-powered optimization algorithms
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    Real-time alerts and notifications
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    Predictive maintenance scheduling
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Ready to transform your operations?
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Join the future of intelligent fleet management. 
              Start optimizing your trainset operations today.
            </p>
            <Button 
              size="lg" 
              className="px-12 py-4 text-lg"
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
            >
              <Zap className="mr-2 h-5 w-5" />
              {isAuthenticated ? "Go to Dashboard" : "Get Started Now"}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Train className="h-6 w-6 text-gray-600" />
              <span className="text-gray-600">Kochi Metro Trainset Management System</span>
            </div>
            <div className="text-sm text-gray-500">
              Powered by AI • Built for Scale • Designed for Efficiency
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
"use client";

import React, { useState, useEffect } from "react";
import { PipelineSkeleton } from "@/platform/ui/components/Loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/shared/components/ui/card";
import { Badge } from "@/platform/shared/components/ui/badge";
import { Button } from "@/platform/shared/components/ui/button";
import { Progress } from "@/platform/shared/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Database,
  Server,
  Cloud,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import {
  costOptimizationEngine,
  COGSAnalysis,
  CostOptimization,
} from "@/platform/enterprise/CostOptimizationEngine";

interface CostMetrics {
  totalMonthlyCOGS: number;
  optimizedCOGS: number;
  potentialSavings: number;
  marginImprovement: number;
  reinvestmentCapacity: {
    monthlySavings: number;
    annualSavings: number;
    additionalRDCapacity: number;
    additionalMarketingBudget: number;
  };
}

export default function CostOptimizationDashboard() {
  const [analysis, setAnalysis] = useState<COGSAnalysis | null>(null);
  const [reinvestment, setReinvestment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    loadCostAnalysis();
  }, []);

  const loadCostAnalysis = async () => {
    try {
      setLoading(true);
      const [cogsAnalysis, reinvestmentData] = await Promise.all([
        costOptimizationEngine.analyzeCOGS(),
        costOptimizationEngine.calculateReinvestmentPotential(),
      ]);

      setAnalysis(cogsAnalysis);
      setReinvestment(reinvestmentData);
    } catch (error) {
      console.error("Failed to load cost analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  const implementOptimization = async (optimization: CostOptimization) => {
    // TODO: Implement automatic optimization
    console.log("Implementing optimization:", optimization.description);
    await loadCostAnalysis(); // Refresh data
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "infrastructure":
        return <Server className="h-4 w-4" />;
      case "database":
        return <Database className="h-4 w-4" />;
      case "api":
        return <Zap className="h-4 w-4" />;
      case "storage":
        return <Cloud className="h-4 w-4" />;
      case "bandwidth":
        return <TrendingUp className="h-4 w-4" />;
      case "third-party":
        return <Target className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-[var(--hover)] text-gray-800";
    }
  };

  const filteredRecommendations =
    analysis?.recommendations.filter(
      (rec) => selectedCategory === "all" || rec['category'] === selectedCategory,
    ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <PipelineSkeleton message="Loading cost data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cost Optimization Engine</h1>
          <p className="text-[var(--muted)]">Maximize margins for R&D reinvestment</p>
        </div>
        <Button onClick={loadCostAnalysis} disabled={loading}>
          Refresh Analysis
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Monthly COGS
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analysis?.currentMonthlyCOGS.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total infrastructure costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Optimized COGS
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${analysis?.optimizedMonthlyCOGS.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">After optimizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Savings
            </CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${analysis?.potentialSavings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {((analysis?.marginImprovement || 0) * 100).toFixed(1)}% margin
              improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Annual R&D Capacity
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${reinvestment?.additionalRDCapacity.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              60% of savings to R&D
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reinvestment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Reinvestment Allocation</CardTitle>
          <CardDescription>
            How cost savings can be reinvested for growth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">R&D Investment</span>
                  <span className="text-sm text-purple-600">60%</span>
                </div>
                <Progress value={60} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  ${reinvestment?.additionalRDCapacity.toLocaleString()}/year
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Marketing Budget</span>
                  <span className="text-sm text-blue-600">40%</span>
                </div>
                <Progress value={40} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  ${reinvestment?.additionalMarketingBudget.toLocaleString()}
                  /year
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Impact Projection</h4>
              <ul className="text-sm space-y-1 text-[var(--muted)]">
                <li>• 3-5 additional engineers</li>
                <li>• 2x faster feature development</li>
                <li>• Premium enterprise features</li>
                <li>• Enhanced AI capabilities</li>
                <li>• Global market expansion</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          "all",
          "infrastructure",
          "database",
          "api",
          "storage",
          "bandwidth",
          "third-party",
        ].map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {getCategoryIcon(category)}
            <span className="ml-1 capitalize">{category}</span>
          </Button>
        ))}
      </div>

      {/* Optimization Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRecommendations.map((rec, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(rec.category)}
                  <CardTitle className="text-lg">{rec.description}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getRiskColor(rec.riskLevel)}>
                    {rec.riskLevel} risk
                  </Badge>
                  <Badge variant="outline">
                    {rec.implementationEffort} effort
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-[var(--muted)]">Current</p>
                    <p className="text-lg font-bold">${rec.currentCost}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--muted)]">Optimized</p>
                    <p className="text-lg font-bold text-green-600">
                      ${rec.optimizedCost}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--muted)]">Savings</p>
                    <p className="text-lg font-bold text-blue-600">
                      ${rec.savings}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-700 mb-3">{rec.impact}</p>

                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <span className="text-[var(--muted)]">Monthly ROI: </span>
                      <span className="font-bold text-green-600">
                        {((rec.savings / rec.currentCost) * 100).toFixed(0)}%
                      </span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => implementOptimization(rec)}
                      disabled={rec['riskLevel'] === "high"}
                    >
                      {rec['riskLevel'] === "high" ? (
                        <>
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Review Required
                        </>
                      ) : (
                        "Implement"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Optimizations</CardTitle>
          <CardDescription>
            Low-risk optimizations that can be implemented immediately
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start space-y-2"
              onClick={() => costOptimizationEngine.monitorAndOptimize()}
            >
              <Zap className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <p className="font-medium">Enable Auto-Optimization</p>
                <p className="text-xs text-[var(--muted)]">
                  Automatic COGS monitoring
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start space-y-2"
            >
              <Server className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <p className="font-medium">Edge Function Migration</p>
                <p className="text-xs text-[var(--muted)]">60% cost reduction</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start space-y-2"
            >
              <Database className="h-5 w-5 text-purple-600" />
              <div className="text-left">
                <p className="font-medium">Smart Query Caching</p>
                <p className="text-xs text-[var(--muted)]">Save $150/month</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

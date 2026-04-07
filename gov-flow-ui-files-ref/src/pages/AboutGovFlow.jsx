import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CheckCircle, Mail, Users, Bell, Calendar, BarChart3, Workflow, Shield, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    id: 1,
    title: "GovFlow: Empowering Modern Government Workflows",
    subtitle: "Streamline Operations, Enhance Collaboration, Drive Accountability",
    icon: Workflow,
    gradient: "from-blue-600 to-indigo-600"
  },
  {
    id: 2,
    title: "The Challenge: The Daily Deluge of Operational Demands",
    content: [
      { icon: Mail, text: "Email Overload & Unstructured Requests", desc: "Critical inquiries, updates, and tasks arrive continuously via email and other channels, often leading to disorganization and missed actions." },
      { icon: CheckCircle, text: "Manual Task Creation & Assignment", desc: "Converting these diverse communications into actionable tasks, assigning them, and tracking their progress is a time-consuming and error-prone manual process." },
      { icon: BarChart3, text: "Lack of Transparency", desc: "Difficulty monitoring the status of individual requests, updates, and daily operational tasks across teams." },
      { icon: Users, text: "Siloed Communication", desc: "Fragmented information and communication gaps hinder efficient collaboration on time-sensitive, unplanned work." },
      { icon: Shield, text: "Accountability Gaps", desc: "Ensuring clear ownership and tracking the completion of everyday operational items is a significant challenge." }
    ],
    gradient: "from-red-500 to-orange-500"
  },
  {
    id: 3,
    title: "Our Solution: Introducing GovFlow",
    subtitle: "A smart tool to convert emails into actionable tasks with team assignment, tracking, and approval workflows.",
    description: "GovFlow is a comprehensive, intuitive workflow management platform designed specifically for government entities to centralize, automate, and optimize their daily operations. Transform unstructured communications into structured, trackable initiatives.",
    gradient: "from-green-500 to-emerald-600"
  },
  {
    id: 4,
    title: "Key Feature 1: Email-to-Task Conversion",
    content: [
      { icon: Mail, text: "Integrated Email Inbox", desc: "Centralize and manage all email communications directly within GovFlow." },
      { icon: Workflow, text: "Intelligent Email Routing", desc: "Automate email processing with routing rules based on subject, sender, or content to categorize, assign, or prioritize." },
      { icon: CheckCircle, text: "One-Click Task Creation", desc: "Convert emails into structured tasks with full context and attachments preserved." },
      { icon: Users, text: "Smart Assignment", desc: "AI-powered suggestions for task assignment based on content, priority, and team availability." }
    ],
    gradient: "from-purple-500 to-pink-500"
  },
  {
    id: 5,
    title: "Key Feature 2: Comprehensive Task Management",
    content: [
      { icon: CheckCircle, text: "Structured Initiatives", desc: "Define and track projects with detailed descriptions, deliverables, and timelines." },
      { icon: Workflow, text: "Granular Subtasks", desc: "Break down complex projects into manageable subtasks with individual owners and checklists." },
      { icon: BarChart3, text: "Dynamic Status & Priority", desc: "Configurable statuses and priorities to match your agency's needs." },
      { icon: Calendar, text: "Task Dependencies", desc: "Visualize and manage prerequisite tasks to ensure logical progression." }
    ],
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    id: 6,
    title: "Key Feature 3: Visual Workflows & Approvals",
    content: [
      { icon: Workflow, text: "Intuitive Kanban Board", desc: "Visualize all tasks across workflow stages with drag-and-drop interface." },
      { icon: CheckCircle, text: "Customizable Workflow Stages", desc: "Define unique sequences tailored to your agency's processes (Pipeline, Planning, In Review, Approved)." },
      { icon: Shield, text: "Built-in Approval Flows", desc: "Implement mandatory approval steps with specific approvers and status tracking." },
      { icon: Users, text: "Real-time Collaboration", desc: "Team members see updates instantly as tasks move through stages." }
    ],
    gradient: "from-indigo-500 to-purple-600"
  },
  {
    id: 7,
    title: "Key Feature 4: Smart Notifications & Access Control",
    content: [
      { icon: Bell, text: "Automated Notifications", desc: "Real-time and email alerts for assignments, due dates, status changes, and approvals." },
      { icon: Users, text: "Customizable Preferences", desc: "Users control how and when they receive notifications." },
      { icon: Shield, text: "Role-Based Access Control", desc: "Fine-grained permissions for Admin, Department Admin, Manager, and Team Member roles." },
      { icon: BarChart3, text: "Team Management", desc: "Organize users into departments with clear hierarchy and reporting lines." }
    ],
    gradient: "from-yellow-500 to-orange-500"
  },
  {
    id: 8,
    title: "Benefits: Why GovFlow for Your Agency?",
    content: [
      { icon: Zap, text: "Increased Efficiency", desc: "Automate routine tasks and streamline workflows, freeing up valuable time." },
      { icon: BarChart3, text: "Enhanced Transparency", desc: "Gain a clear, real-time overview of all operations and initiative progress." },
      { icon: Users, text: "Improved Collaboration", desc: "Foster seamless communication and teamwork across departments." },
      { icon: Shield, text: "Greater Accountability", desc: "Clearly define roles, responsibilities, and ownership for every task." },
      { icon: CheckCircle, text: "Reduced Risk", desc: "Minimize errors and ensure compliance through structured processes and approvals." }
    ],
    gradient: "from-green-600 to-teal-600"
  },
  {
    id: 9,
    title: "Security & Deployment",
    subtitle: "Sovereign, Secure, and Compliant",
    features: [
      { title: "On-Premise Deployment", desc: "Fully deployable on government servers - complete data sovereignty and control within UAE infrastructure" },
      { title: "UAE Government Compliance", desc: "Fully aligned with UAE Government security standards, regulations, and data protection requirements" },
      { title: "Enterprise-Grade Security", desc: "End-to-end encryption, role-based access control, audit trails, and multi-factor authentication" },
      { title: "Data Sovereignty", desc: "All data stays within government-controlled infrastructure with no external dependencies" }
    ],
    gradient: "from-slate-700 to-slate-900"
  },
  {
    id: 10,
    title: "Transform Your Government's Workflow Today",
    subtitle: "Experience the power of intelligent task management",
    cta: true,
    gradient: "from-blue-600 to-indigo-700"
  }
];

export default function AboutGovFlow() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`bg-gradient-to-br ${slide.gradient} text-white shadow-2xl overflow-hidden`}>
              <div className="min-h-[600px] p-12 flex flex-col justify-between">
                {/* Slide 1: Title */}
                {slide.id === 1 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
                    <Workflow className="w-24 h-24 mb-4 animate-pulse" />
                    <h1 className="text-6xl font-bold mb-6">{slide.title}</h1>
                    <p className="text-2xl opacity-90">{slide.subtitle}</p>
                  </div>
                )}

                {/* Slide 2: Challenge */}
                {slide.id === 2 && (
                  <div className="space-y-8">
                    <h2 className="text-4xl font-bold mb-8">{slide.title}</h2>
                    <div className="space-y-6">
                      {slide.content.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex gap-4 items-start bg-white/10 backdrop-blur-sm p-4 rounded-lg"
                          >
                            <Icon className="w-6 h-6 flex-shrink-0 mt-1" />
                            <div>
                              <h3 className="font-semibold text-lg mb-1">{item.text}</h3>
                              <p className="text-sm opacity-90">{item.desc}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Slide 3: Solution */}
                {slide.id === 3 && (
                  <div className="flex flex-col justify-center h-full space-y-8">
                    <h2 className="text-5xl font-bold mb-4">{slide.title}</h2>
                    <p className="text-2xl opacity-90 mb-6">{slide.subtitle}</p>
                    <p className="text-xl opacity-80 leading-relaxed">{slide.description}</p>
                  </div>
                )}

                {/* Slides 4-8: Features */}
                {slide.id >= 4 && slide.id <= 8 && (
                  <div className="space-y-8">
                    <h2 className="text-4xl font-bold mb-8">{slide.title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {slide.content.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white/10 backdrop-blur-sm p-6 rounded-lg"
                          >
                            <Icon className="w-8 h-8 mb-3" />
                            <h3 className="font-semibold text-lg mb-2">{item.text}</h3>
                            <p className="text-sm opacity-90">{item.desc}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Slide 9: Technology */}
                {slide.id === 9 && (
                  <div className="space-y-8">
                    <div className="text-center mb-8">
                      <h2 className="text-4xl font-bold mb-2">{slide.title}</h2>
                      <p className="text-xl opacity-90">{slide.subtitle}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {slide.features.map((feature, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-white/10 backdrop-blur-sm p-6 rounded-lg"
                        >
                          <h3 className="font-bold text-xl mb-2">{feature.title}</h3>
                          <p className="opacity-90">{feature.desc}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Slide 10: CTA */}
                {slide.id === 10 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
                    <h2 className="text-5xl font-bold mb-4">{slide.title}</h2>
                    <p className="text-2xl opacity-90 mb-8">{slide.subtitle}</p>
                    <div className="space-y-4">
                      <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100 text-lg px-8 py-6">
                        Request a Demo
                      </Button>
                      <p className="text-sm opacity-75">Contact us to learn more about GovFlow</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-3 h-3 rounded-full transition-all ${
                  idx === currentSlide ? "bg-white w-8" : "bg-white/30"
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Next
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        <div className="text-center mt-4 text-white/60 text-sm">
          Slide {currentSlide + 1} of {slides.length}
        </div>
      </div>
    </div>
  );
}
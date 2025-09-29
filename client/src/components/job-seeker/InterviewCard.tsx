import { useState } from "react";
import { motion } from "framer-motion";
import {
  MdCalendarToday,
  MdAccessTime,
  MdLocationOn,
  MdVideoCall,
  MdDescription,
  MdCheck,
  MdClose,
  MdSchedule,
  MdNotifications,
  MdBusiness,
} from "react-icons/md";
import Button from "../ui/Button";

interface Interview {
  id: string;
  scheduledDate: string;
  scheduledTime: string;
  description?: string;
  location?: string;
  isVirtual: boolean;
  meetingLink?: string;
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
}

interface InterviewCardProps {
  interview: Interview;
  jobTitle: string;
  companyName: string;
  className?: string;
}

export default function InterviewCard({ interview, jobTitle, companyName, className = "" }: InterviewCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300";
      case "CONFIRMED":
        return "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300";
      case "COMPLETED":
        return "bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-300";
      case "CANCELLED":
        return "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300";
      case "RESCHEDULED":
        return "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <MdSchedule className="w-4 h-4" />;
      case "CONFIRMED":
        return <MdCheck className="w-4 h-4" />;
      case "COMPLETED":
        return <MdCheck className="w-4 h-4" />;
      case "CANCELLED":
        return <MdClose className="w-4 h-4" />;
      case "RESCHEDULED":
        return <MdSchedule className="w-4 h-4" />;
      default:
        return <MdSchedule className="w-4 h-4" />;
    }
  };

  const isUpcoming = new Date(interview.scheduledDate) > new Date() && 
    (interview.status === "SCHEDULED" || interview.status === "CONFIRMED");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative border rounded-xl p-4 transition-all duration-200 hover:shadow-lg ${getStatusColor(interview.status)} ${className}`}
      >
        {/* Urgent notification for upcoming interviews */}
        {isUpcoming && (
          <div className="absolute -top-2 -right-2">
            <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
              <MdNotifications className="w-3 h-3" />
              Upcoming
            </div>
          </div>
        )}

        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg text-foreground">Interview Scheduled</h3>
              <p className="text-sm text-muted-foreground">{jobTitle} at {companyName}</p>
            </div>
            
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${getStatusColor(interview.status)}`}>
              {getStatusIcon(interview.status)}
              {interview.status}
            </span>
          </div>

          {/* Interview Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <MdCalendarToday className="w-4 h-4 text-primary" />
              <span className="font-medium">{formatDate(interview.scheduledDate)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MdAccessTime className="w-4 h-4 text-primary" />
              <span className="font-medium">{interview.scheduledTime}</span>
            </div>
            
            <div className="flex items-center gap-2 sm:col-span-2">
              {interview.isVirtual ? (
                <MdVideoCall className="w-4 h-4 text-green-500" />
              ) : (
                <MdLocationOn className="w-4 h-4 text-blue-500" />
              )}
              <span className="truncate">{interview.location}</span>
            </div>
          </div>

          {/* Description Preview */}
          {interview.description && (
            <div className="bg-background/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {interview.description}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(true)}
              className="flex items-center gap-2 flex-1"
            >
              <MdDescription className="w-4 h-4" />
              View Details
            </Button>
            
            {interview.isVirtual && interview.meetingLink && isUpcoming && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.open(interview.meetingLink, "_blank")}
                className="flex items-center gap-2 flex-1"
              >
                <MdVideoCall className="w-4 h-4" />
                Join Meeting
              </Button>
            )}
          </div>

          {/* Countdown for upcoming interviews */}
          {isUpcoming && (
            <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 text-primary">
                <MdSchedule className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Interview in {Math.ceil((new Date(interview.scheduledDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} day(s)
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Interview Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold">Interview Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Job Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MdBusiness className="w-5 h-5" />
                  Job Information
                </h3>
                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <p><span className="font-medium">Position:</span> {jobTitle}</p>
                  <p><span className="font-medium">Company:</span> {companyName}</p>
                </div>
              </div>
              
              {/* Schedule Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MdCalendarToday className="w-5 h-5" />
                  Schedule Details
                </h3>
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <MdCalendarToday className="w-4 h-4" />
                      <span className="text-sm">
                        {new Date(interview.scheduledDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MdAccessTime className="w-4 h-4" />
                      <span className="text-sm">{interview.scheduledTime}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {interview.isVirtual ? (
                      <MdVideoCall className="w-4 h-4 text-green-500" />
                    ) : (
                      <MdLocationOn className="w-4 h-4 text-blue-500" />
                    )}
                    <span className="text-sm">{interview.location}</span>
                  </div>
                  
                  {interview.meetingLink && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm font-medium mb-2">Meeting Link:</p>
                      <a 
                        href={interview.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm break-all"
                      >
                        {interview.meetingLink}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Status */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Status</h3>
                <div className={`p-4 rounded-lg border ${getStatusColor(interview.status)}`}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(interview.status)}
                    <span className="font-medium">{interview.status}</span>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              {interview.description && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Description</h3>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-muted-foreground text-sm">
                      {interview.description}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                {interview.isVirtual && interview.meetingLink && isUpcoming && (
                  <Button
                    onClick={() => window.open(interview.meetingLink, "_blank")}
                    className="flex items-center gap-2"
                  >
                    <MdVideoCall className="w-4 h-4" />
                    Join Meeting
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
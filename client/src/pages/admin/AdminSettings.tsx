import { motion } from "framer-motion";
import {
  MdSettings,
  MdSecurity,
  MdNotifications,
  MdStorage,
} from "react-icons/md";

export default function AdminSettings() {
  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <MdSettings className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                System Settings
              </h1>
              <p className="text-muted-foreground">
                Configure system settings and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdSettings className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            System Settings Coming Soon
          </h2>
          <p className="text-muted-foreground mb-6">
            This feature will allow you to configure system settings, security
            options, and platform preferences.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MdSecurity className="w-4 h-4" />
              <span>Security Settings</span>
            </div>
            <div className="flex items-center gap-2">
              <MdNotifications className="w-4 h-4" />
              <span>Notification Settings</span>
            </div>
            <div className="flex items-center gap-2">
              <MdStorage className="w-4 h-4" />
              <span>Database Settings</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

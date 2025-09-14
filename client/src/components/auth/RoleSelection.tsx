import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiBriefcase, FiArrowRight } from 'react-icons/fi';
import type { UserRole } from '../../types/auth';

interface RoleSelectionProps {
  onRoleSelect: (role: UserRole) => void;
  selectedRole?: UserRole;
}

export function RoleSelection({ onRoleSelect, selectedRole }: RoleSelectionProps) {
  const [hoveredRole, setHoveredRole] = useState<UserRole | null>(null);

  const roles = [
    {
      type: 'JOB_SEEKER' as UserRole,
      title: 'Job Seeker',
      description: 'Find your dream job and advance your career',
      icon: FiUser,
      features: [
        'Browse thousands of job opportunities',
        'Create and manage your professional profile',
        'Apply to jobs with one click',
        'Track your application status',
        'Get job recommendations',
      ],
      buttonText: 'I\'m looking for a job',
      gradient: 'bg-gradient-to-r from-neutral-500 to-neutral-600',
      bgGradient: 'bg-gradient-to-br from-neutral-50 to-neutral-100',
      hoverBorder: 'border-neutral-500 ring-4 ring-neutral-100',
    },
    {
      type: 'EMPLOYER' as UserRole,
      title: 'Employer',
      description: 'Find the best talent for your organization',
      icon: FiBriefcase,
      features: [
        'Post unlimited job openings',
        'Access our talent database',
        'Manage applications efficiently',
        'Build your company brand',
        'Get premium candidate insights',
      ],
      buttonText: 'I\'m hiring talent',
      gradient: 'bg-gradient-to-r from-secondary-500 to-secondary-600',
      bgGradient: 'bg-gradient-to-br from-secondary-50 to-secondary-100',
      hoverBorder: 'border-secondary-500 ring-4 ring-secondary-100',
    },
  ];

  return (
    <div 
      className="min-h-screen py-12 px-4 relative"
      style={{
        backgroundImage: `linear-gradient(rgba(var(--color-background), 0.95), rgba(var(--color-background), 0.95))`,
      }}
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Join <span className="text-neutral-600">Employ.me</span>
          </motion.h1>
          <motion.p 
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Choose your path and start your journey with Ghana's premier job platform
          </motion.p>
        </div>

        {/* Role Cards */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto px-4">
          {roles.map((role, index) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.type;
            const isHovered = hoveredRole === role.type;
            
            return (
              <motion.div
                key={role.type}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                className={`relative bg-card rounded-2xl p-10 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 min-h-[500px] ${
                  isSelected ? 'border-neutral-500 ring-4 ring-neutral-100' : 'border-border hover:border-muted-foreground'
                }`}
                onMouseEnter={() => setHoveredRole(role.type)}
                onMouseLeave={() => setHoveredRole(null)}
                onClick={() => onRoleSelect(role.type)}
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${role.bgGradient} rounded-2xl opacity-0 transition-opacity duration-300 ${
                  isHovered || isSelected ? 'opacity-10' : ''
                }`} />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl ${role.gradient} text-white mb-6`}>
                    <Icon size={32} />
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    {role.title}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {role.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {role.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <div className="w-2 h-2 bg-neutral-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-muted-foreground text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <motion.button
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-white ${role.gradient} hover:shadow-lg transition-all duration-300 flex items-center justify-center group`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRoleSelect(role.type);
                    }}
                  >
                    {role.buttonText}
                    <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </motion.button>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    className="absolute top-4 right-4 w-6 h-6 bg-neutral-500 rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

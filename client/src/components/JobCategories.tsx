import { Link } from "react-router-dom";
import {
  HiCode,
  HiHeart,
  HiBriefcase,
  HiAcademicCap,
  HiSpeakerphone,
  HiTrendingUp,
} from "react-icons/hi";
import { getCategoryLabel } from "../utils/constants";

const CategoryCard = ({
  category,
  icon,
  count,
  description,
}: {
  category: string;
  icon: React.ReactNode;
  count: number;
  description: string;
}) => (
  <Link
    to={`/jobs?category=${encodeURIComponent(category)}`}
    className="group block bg-card dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
  >
    <div className="flex items-center mb-4">
      <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
        {icon}
      </div>
      <div className="ml-4">
        <h3 className="text-lg font-semibold text-foreground dark:text-white group-hover:text-primary transition-colors">
          {getCategoryLabel(category)}
        </h3>
        <p className="text-sm text-muted-foreground dark:text-gray-400">
          {count} open positions
        </p>
      </div>
    </div>
    <p className="text-sm text-muted-foreground dark:text-gray-300 group-hover:text-muted-foreground">
      {description}
    </p>
  </Link>
);

const JobCategories = () => {
  const categories = [
    {
      category: "TECHNOLOGY",
      icon: <HiCode className="w-6 h-6" />,
      count: 45,
      description: "Software development, IT support, data science, and more",
    },
    {
      category: "HEALTHCARE",
      icon: <HiHeart className="w-6 h-6" />,
      count: 23,
      description: "Medical professionals, healthcare administration, nursing",
    },
    {
      category: "FINANCE",
      icon: <HiBriefcase className="w-6 h-6" />,
      count: 18,
      description: "Banking, accounting, financial planning, investment",
    },
    {
      category: "Education",
      icon: <HiAcademicCap className="w-6 h-6" />,
      count: 31,
      description: "Teaching positions, educational administration, tutoring",
    },
    {
      category: "Marketing",
      icon: <HiSpeakerphone className="w-6 h-6" />,
      count: 27,
      description: "Digital marketing, brand management, content creation",
    },
    {
      category: "Sales",
      icon: <HiTrendingUp className="w-6 h-6" />,
      count: 19,
      description:
        "Sales representatives, business development, account management",
    },
  ];

  return (
    <section className="py-16 bg-background dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground dark:text-white">
            Browse Jobs by Category
          </h2>
          <p className="text-xl text-muted-foreground dark:text-gray-400 max-w-2xl mx-auto">
            Find opportunities in your field of expertise across Ghana's growing
            job market
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <CategoryCard key={cat.category} {...cat} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/jobs"
            className="inline-flex items-center px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            View All Categories
          </Link>
        </div>
      </div>
    </section>
  );
};

export default JobCategories;

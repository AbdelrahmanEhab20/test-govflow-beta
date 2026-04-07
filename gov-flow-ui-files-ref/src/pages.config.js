/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AboutGovFlow from './pages/AboutGovFlow';
import CalendarView from './pages/CalendarView';
import DepartmentManagement from './pages/DepartmentManagement';
import EmailInbox from './pages/EmailInbox';
import KanbanBoard from './pages/KanbanBoard';
import NotificationPreferences from './pages/NotificationPreferences';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import RoutingRules from './pages/RoutingRules';
import Settings from './pages/Settings';
import TaskDetail from './pages/TaskDetail';
import TaskForm from './pages/TaskForm';
import Tasks from './pages/Tasks';
import MyDashboard from './pages/MyDashboard';
import Team from './pages/Team';
import TeamPerformanceDashboard from './pages/TeamPerformanceDashboard';
import WorkflowStageManagement from './pages/WorkflowStageManagement';
import Leaderboard from './pages/Leaderboard';
import AccessControl from './pages/AccessControl';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AboutGovFlow": AboutGovFlow,
    "CalendarView": CalendarView,
    "DepartmentManagement": DepartmentManagement,
    "EmailInbox": EmailInbox,
    "KanbanBoard": KanbanBoard,
    "NotificationPreferences": NotificationPreferences,
    "Profile": Profile,
    "Reports": Reports,
    "RoutingRules": RoutingRules,
    "Settings": Settings,
    "TaskDetail": TaskDetail,
    "TaskForm": TaskForm,
    "Tasks": Tasks,
    "MyDashboard": MyDashboard,
    "Team": Team,
    "TeamPerformanceDashboard": TeamPerformanceDashboard,
    "WorkflowStageManagement": WorkflowStageManagement,
    "Leaderboard": Leaderboard,
    "AccessControl": AccessControl,
}

export const pagesConfig = {
    mainPage: "MyDashboard",
    Pages: PAGES,
    Layout: __Layout,
};
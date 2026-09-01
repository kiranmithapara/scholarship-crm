import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleBasedRoute } from "./RoleBasedRoute";
import { PageLoader } from "@/components/common/PageLoader";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ROUTES } from "@/constants/routes.constant";
import { ROLES } from "@/constants/roles.constant";

/**
 * Lazy-loaded pages - Code Splitting.
 * Har page apna own JS chunk banata hai, sirf jab wo route visit ho tab load hota hai.
 * Isse initial bundle size chota rehta hai -> fast first load.
 */
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const VerifyOtpPage = lazy(() => import("@/pages/auth/VerifyOtpPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));

const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));

const ReferralPartnerListPage = lazy(() => import("@/pages/referral-partners/ReferralPartnerListPage"));
const ReferralPartnerProfilePage = lazy(() => import("@/pages/referral-partners/ReferralPartnerProfilePage"));
const StudentListPage = lazy(() => import("@/pages/students/StudentListPage"));
const StudentDetailsPage = lazy(() => import("@/pages/students/StudentDetailsPage"));
const MyStudentsPage = lazy(() => import("@/pages/students/MyStudentsPage"));
const ApplyScholarshipPage = lazy(() => import("@/pages/applications/ApplyScholarshipPage"));
const ProfilePage = lazy(() => import("@/pages/profile/ProfilePage"));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));
const LoginLogsPage = lazy(() => import("@/pages/logs/LoginLogsPage"));
const ActivityLogsPage = lazy(() => import("@/pages/logs/ActivityLogsPage"));

const NotFoundPage = lazy(() => import("@/pages/errors/NotFoundPage"));
const UnauthorizedPage = lazy(() => import("@/pages/errors/UnauthorizedPage"));

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ---------- Public Routes ---------- */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.VERIFY_OTP} element={<VerifyOtpPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />

        {/* ---------- Protected Routes (login required) ---------- */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Shared between both roles */}
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            <Route path={ROUTES.STUDENT_DETAILS} element={<StudentDetailsPage />} />

            {/* ---------- Super Admin only ---------- */}
            <Route element={<RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
              <Route path={ROUTES.REFERRAL_PARTNERS} element={<ReferralPartnerListPage />} />
              <Route path={ROUTES.REFERRAL_PARTNER_DETAILS} element={<ReferralPartnerProfilePage />} />
              <Route path={ROUTES.STUDENTS} element={<StudentListPage />} />
              <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
              <Route path={ROUTES.LOGIN_LOGS} element={<LoginLogsPage />} />
              <Route path={ROUTES.ACTIVITY_LOGS} element={<ActivityLogsPage />} />
            </Route>

            {/* ---------- Referral Admin only ---------- */}
            <Route element={<RoleBasedRoute allowedRoles={[ROLES.REFERRAL_ADMIN]} />}>
              <Route path={ROUTES.APPLY_SCHOLARSHIP} element={<ApplyScholarshipPage />} />
              <Route path={ROUTES.MY_STUDENTS} element={<MyStudentsPage />} />
            </Route>

            <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
          </Route>
        </Route>

        {/* ---------- Fallback ---------- */}
        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

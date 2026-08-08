"use client"
import React from "react"

// قاموس الإنجليزي المؤقت للـ Sidebar وباقي أجزاء النظام
const enDictionary: Record<string, string> = {
  // Main Navigation
  "sidebar.dashboard": "Dashboard",
  "sidebar.newVisit": "New Visit",
  "sidebar.appointments": "Appointments",
  "sidebar.patients": "Patients",
  "sidebar.invoices": "Invoices",
  "sidebar.waitingRoom": "Waiting Room",
  "sidebar.gallery": "Gallery",
  "sidebar.onlineBookings": "Online Bookings",
  "sidebar.reception": "Reception",
  
  // Administration Section
  "SIDEBAR.ADMINISTRATION": "ADMINISTRATION",
  "sidebar.usersRoles": "Users & Roles",
  "sidebar.clinicSettings": "Clinic Settings",
  "sidebar.publicBooking": "Public Booking",
  "sidebar.feedback": "Feedback",
  "sidebar.branches": "Branches",
  "sidebar.billing": "Billing & Subscriptions",
  "sidebar.billingPlan": "Billing Plans",
  "sidebar.notifications": "Notifications",
  "sidebar.superAdmin": "Super Admin",
  "sidebar.plans": "Plans & Pricing",
  "sidebar.activationCodes": "Activation Codes",
  "sidebar.auditLogs": "Audit Logs",
  "sidebar.systemHealth": "System Health",
  "sidebar.announcements": "Announcements",
  "sidebar.testimonials": "Testimonials",
  "sidebar.features": "Features",
  "sidebar.onlineBooking": "Online Booking",
  "landing.trustedByClinics": "Trusted by Clinics & Medical Centers",
  "landing.trustedByDesc": "Our platform is trusted by clinics and medical centers across the region, providing seamless management and patient care.",
  "TABLE.PATIENT": "Patient",
  "TABLE.DOCTOR": "Doctor",
  "TABLE.DATE": "Date",
  "TABLE.TIME": "Time",
  "TABLE.PHONE": "Phone",
  "TABLE.EMAIL": "Email",
  "TABLE.GENDER": "Gender",
  "TABLE.ACTIONS": "Actions",
  "TABLE.DOB": "Date of Birth",
  "TABLE.VIEW": "View",
  "TABLE.EDIT": "Edit",
  "TABLE.DELETE": "Delete", 
  "menu.accountSettings": "Account Settings",
  "menu.logout": "Logout",
  "menu.profile": "Profile",
  "menu.clinicSettings": "Clinic Settings",
  "menu.helpSupport": "Help & Support",
  "lang.ar": "Arabic",
  
  // Common Actions & Misc
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.add": "Add",
  "common.search": "Search...",
  "common.loading": "Loading...",
  "common.noData": "No data found",
  "common.confirm": "Confirm",
  "common.back": "Back",
  "common.next": "Next",

}

export const LangProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export const useLang = () => {
  return {
    lang: "en",
    locale: "en",
    setLang: (newLocale: string) => {},
    setLocale: (newLocale: string) => {},
    isRTL: false,
    // لو الكلمة موجودة في القاموس يرجع المعنى، لو مش موجودة يرجع الكلمة الأصلية نظيفة
    t: (key: string) => enDictionary[key] || key 
  }
}
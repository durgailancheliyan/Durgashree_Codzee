import React, { useEffect, useState } from 'react';
import { onboardingService } from '@/services/onboarding.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import PracticeSettings from '@/components/settings/PracticeSettings';
import LocationSettings from '@/components/settings/LocationSettings';
import UserSettings from '@/components/settings/UserSettings';
import SubscriptionSettings from '@/components/settings/SubscriptionSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Building2, MapPin, Users, CreditCard, Calendar } from 'lucide-react'; // Add Calendar icon
import PatientConfig from '@/pages/configuration/patientconfig'; // Add this import
import AppointmentConfig from '@/pages/configuration/appointmentconfig'; // Add this import
import TreatmentConfig from '@/pages/configuration/treatmentconfig'; // Add this import
import PaymentConfig from '@/pages/configuration/paymentconfig'; // Add this import

const sections = [
	{ key: "practice", label: "Practice", icon: <Building2 className="h-5 w-5 mr-2" /> },
	{ key: "locations", label: "Locations", icon: <MapPin className="h-5 w-5 mr-2" /> },
	{ key: "users", label: "Users", icon: <Users className="h-5 w-5 mr-2" /> },
	{ key: "subscription", label: "Subscription", icon: <CreditCard className="h-5 w-5 mr-2" /> },
	// { key: "patientconfig", label: "Patient Settings", icon: <Users className="h-5 w-5 mr-2" /> },
	// { key: "appointmentconfig", label: "Appointment Settings", icon: <Calendar className="h-5 w-5 mr-2" /> },
	{ key: "treatmentconfig", label: "Treatment Settings", icon: <CreditCard className="h-5 w-5 mr-2" /> },
	// { key: "paymentconfig", label: "Payment Config", icon: <CreditCard className="h-5 w-5 mr-2" /> }, // Add this line
];

const Settings: React.FC = () => {
	const { user } = useAuth();
	const [activeSection, setActiveSection] = useState("practice");
	const [practiceId, setPracticeId] = useState<string | null>(user?.practiceId ?? null);

	useEffect(() => {
		if (!user?.id) return;
		setPracticeId(user.practiceId ?? null);
		onboardingService.getOnboardingData(user.id).then((data) => {
			if (data.practice?.id) setPracticeId(data.practice.id);
		}).catch(() => {});
	}, [user?.id, user?.practiceId]);
	const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({
		practice: false,
		locations: false,
		users: false,
		subscription: false,
	});

	if (user?.role !== 'Admin') {
		return <Navigate to="/" replace />;
	}

	return (
		<div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
			{/* Sidebar: vertical on desktop, horizontal on mobile */}
			<aside className="md:w-64 w-full bg-white border-b md:border-b-0 md:border-r shadow-lg flex md:flex-col flex-row py-2 md:py-8 px-2 md:px-4 overflow-x-auto md:overflow-x-visible">
				<nav className="flex md:flex-col flex-row gap-2 w-full">
					{sections.map((section) => (
						<React.Fragment key={section.key}>
							{section.key === "patientconfig" && (
								<hr className="my-6 border-blue-200" />
							)}
							<button
								className={`flex items-center px-3 py-2 md:px-4 md:py-3 rounded-lg transition font-medium whitespace-nowrap ${
									activeSection === section.key
										? "bg-blue-100 text-blue-700 shadow"
										: "hover:bg-gray-100 text-gray-700"
								}`}
								style={{ minWidth: 120 }}
								onClick={() => setActiveSection(section.key)}
							>
								{section.icon}
								<span className="hidden sm:inline">{section.label}</span>
							</button>
						</React.Fragment>
					))}
				</nav>
			</aside>

			{/* Main Content */}
			<main className="flex-1 flex justify-center items-start px-2 md:px-4">
				<div className="w-full max-w-10xl">
					{activeSection === "practice" && (
						<Card className="shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-md mb-6">
							<CardHeader>
								<CardTitle>Practice</CardTitle>
								<CardDescription>Manage your practice details.</CardDescription>
							</CardHeader>
							<CardContent>
									<PracticeSettings
										userId={user.id}
									/>
							</CardContent>
						</Card>
					)}

					{activeSection === "locations" && (
						<Card className="shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-md mb-6">
							<CardHeader>
								<CardTitle>Locations</CardTitle>
								<CardDescription>Manage your practice locations.</CardDescription>
							</CardHeader>
							<CardContent>
								<LocationSettings userId={user.id} />
							</CardContent>
						</Card>
					)}

					{activeSection === "users" && (
						<Card className="shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-md mb-6">
							<CardHeader>
								<CardTitle>Users</CardTitle>
								<CardDescription>Manage user accounts and permissions.</CardDescription>
							</CardHeader>
							<CardContent>
								<UserSettings />
							</CardContent>
						</Card>
					)}

					{activeSection === "subscription" && (
						<Card className="shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-md mb-6">
							<CardHeader>
								<CardTitle>Subscription</CardTitle>
								<CardDescription>View and manage your subscription plan.</CardDescription>
							</CardHeader>
							<CardContent>
								<SubscriptionSettings
									editMode={editMode.subscription}
									onEdit={() => setEditMode((m) => ({ ...m, subscription: true }))}
									onCancel={() => setEditMode((m) => ({ ...m, subscription: false }))}
								/>
							</CardContent>
						</Card>
					)}

					{activeSection === "patientconfig" && (
						<Card className="shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-md mb-6">
							<CardContent>
								<PatientConfig />
							</CardContent>
						</Card>
					)}

					{activeSection === "appointmentconfig" && (
						<Card className="shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-md mb-6">
							<CardContent>
								<AppointmentConfig />
							</CardContent>
						</Card>
					)}

					{activeSection === "treatmentconfig" && (
						<Card className="shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-md mb-6">
							<CardHeader>
								<CardTitle>Treatment Settings</CardTitle>
								<CardDescription>
									Categories, treatment plans, and add-ons for your practice.
								</CardDescription>
							</CardHeader>
							<CardContent>
								{practiceId ? (
									<TreatmentConfig practiceId={practiceId} />
								) : (
									<div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900 text-sm">
										Complete <strong>Practice onboarding</strong> first (Practice Details, Locations, Roles),
										then return here to configure treatments.
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{activeSection === "paymentconfig" && (
						<Card className="shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-md mb-6">
							<CardContent>
								<PaymentConfig />
							</CardContent>
						</Card>
					)}
				</div>
			</main>
		</div>
	);
};

export default Settings;
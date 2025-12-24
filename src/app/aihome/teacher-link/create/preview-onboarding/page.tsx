'use client';

import { OrganizationOnboardingPage } from '../OrganizationOnboardingPage';
import { useRouter } from 'next/navigation';

export default function PreviewOnboardingPage() {
    const router = useRouter();

    const handleCreateOrganization = () => {
        console.log('創建機構被點擊');
        // Preview only - will navigate to create panel
        router.push('/aihome/teacher-link/create');
    };

    const handleJoinOrganization = () => {
        console.log('加入機構被點擊');
        router.push('/aihome/teacher-link/create/join-organization');
    };

    return (
        <OrganizationOnboardingPage
            onCreateOrganization={handleCreateOrganization}
            onJoinOrganization={handleJoinOrganization}
        />
    );
}

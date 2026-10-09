import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { onboardingService } from '@/services/onboarding.service';

export function usePracticeId(): { practiceId: string | null; loading: boolean } {
  const { user } = useAuth();
  const [practiceId, setPracticeId] = useState<string | null>(user?.practiceId ?? null);
  const [loading, setLoading] = useState(!user?.practiceId);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    if (user.practiceId) {
      setPracticeId(user.practiceId);
      setLoading(false);
      return;
    }
    setLoading(true);
    onboardingService
      .getOnboardingData(user.id)
      .then((data) => {
        if (data.practice?.id) setPracticeId(data.practice.id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id, user?.practiceId]);

  return { practiceId, loading };
}

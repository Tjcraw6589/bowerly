import { useRouter } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen edges={['top', 'bottom']}>
      <EmptyState
        emoji="🧭"
        title="That page doesn't exist"
        body="The link you followed points somewhere Bowerly doesn't know about."
        actionLabel="Back to bills"
        onAction={() => router.replace('/')}
      />
    </Screen>
  );
}

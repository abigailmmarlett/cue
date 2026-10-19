import { useLocalSearchParams } from 'expo-router';
import { SequenceBuilder } from '@/components/SequenceBuilder';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/ErrorFallback';

export default function EditSequenceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Keyed, so opening another sequence starts a fresh builder.
  return <SequenceBuilder key={id} id={id} />;
}

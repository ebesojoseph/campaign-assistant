import { PageHeader } from '@/components';
import { SegmentBuilderForm, SegmentList, getSegments } from '@/features/segmentation';
import { useAsync } from '@/hooks';

export default function SegmentationPage() {
  const { data, loading, error, reload } = useAsync(getSegments);
  return (
    <>
      <PageHeader title="Segments" description="Define audiences from purchase behaviour and status" />
      <div className="space-y-6">
        <SegmentBuilderForm onCreated={reload} />
        <SegmentList segments={data} loading={loading} error={error} onChanged={reload} />
      </div>
    </>
  );
}

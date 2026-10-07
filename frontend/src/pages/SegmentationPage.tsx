import { Button, PageHeader } from "@/components";
import {
  SegmentBuilderModal,
  SegmentList,
  getSegments,
} from "@/features/segmentation";
import { useAsync } from "@/hooks";
import {PlusIcon } from "lucide-react";
import { useState } from "react";

export default function SegmentationPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data, loading, error, reload } = useAsync(getSegments);

  return (
    <div>
      <PageHeader
        title="Segments"
        description="Define audiences from purchase behaviour and status"
      >
        <Button onClick={() => setModalOpen(true)}> <PlusIcon className="h-4"/> Create Segment</Button>
      </PageHeader>

      <SegmentBuilderModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={reload}
      />
      <SegmentList
        segments={data}
        loading={loading}
        error={error}
        onChanged={reload}
      />
    </div>
  );
}

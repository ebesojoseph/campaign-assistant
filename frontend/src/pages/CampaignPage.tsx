import { PlusIcon, Sparkles } from "lucide-react";
import { Button, Card, PageHeader } from "@/components";
import type { Campaign } from "@/types";
import {
  CampaignModal,
  CampaignList,
  GeneratedCampaignCard,
  listCampaigns,
  useCampaignStore,
} from "@/features/campaigns";
import { useAsync } from "@/hooks";
import { useState } from "react";

export default function CampaignPage() {
  const { current, setCurrent } = useCampaignStore();
  const campaigns = useAsync(() => listCampaigns());
  const [openModal, setOpenModal] = useState(false);

  // Keep the history in sync when the open campaign changes server-side.
  const handleUpdated = (c: Campaign) => {
    setCurrent(c);
    campaigns.reload();
  };

  return (
    <>
      <PageHeader
        title="AI Campaigns"
        description="Generate, refine and approve campaign copy for any channel"
      >
        <PageHeader.Actions>
          <Button icon={Sparkles} onClick={() => setOpenModal(true)}>
           <PlusIcon className="h-4"/>  New Campaign
          </Button>
        </PageHeader.Actions>
      </PageHeader>
      <div className="space-y-6">
        <div className="grid items-start gap-6 xl:grid-cols-2">
          <CampaignModal
            open={openModal}
            onOpenChange={setOpenModal}
            onGenerated={() => campaigns.reload()}
          />
          {/* {current ? (
            <GeneratedCampaignCard
              key={current.id}
              campaign={current}
              onUpdated={handleUpdated}
            />
          ) : (
            <Card
              className="border-dashed"
              bodyClassName="flex flex-col items-center py-16 text-center text-slate-500"
            >
              <Sparkles className="mb-3 h-8 w-8 text-brand-500" />
              <p className="font-medium text-slate-700">
                Your generated campaign appears here
              </p>
              <p className="text-sm">
                Fill in the brief and hit “Generate campaign”.
              </p>
            </Card>
          )} */}
        </div>
        <CampaignList
          campaigns={campaigns.data?.data}
          loading={campaigns.loading}
          error={campaigns.error}
          selectedId={current?.id}
          onSelect={setCurrent}
          onChanged={(removed) => {
            if (removed?.id === current?.id) setCurrent(null);
            campaigns.reload();
          }}
        />
      </div>
    </>
  );
}

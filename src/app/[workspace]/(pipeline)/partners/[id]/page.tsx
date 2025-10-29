import { UniversalRecordPage } from '@/frontend/components/pipeline/UniversalRecordPage';

export default function PartnerRecordPage({ params }: { params: { id: string } }) {
  return <UniversalRecordPage recordType="partners" recordId={params.id} />;
}

type FacilityRecord = {
  id: number;
  name: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeFacility(facility: FacilityRecord) {
  return {
    id: facility.id,
    name: facility.name,
    icon: facility.icon,
    createdAt: facility.createdAt.toISOString(),
    updatedAt: facility.updatedAt.toISOString(),
  };
}

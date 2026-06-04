import type { Pillar } from "@/generated/prisma/client";
import type { CreatePillarDTO, UpdatePillarDTO } from "@/lib/validators/pillar.validator";

export type { Pillar, CreatePillarDTO as CreatePillarCommand, UpdatePillarDTO as UpdatePillarCommand };

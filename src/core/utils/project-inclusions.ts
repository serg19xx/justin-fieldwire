/** Project Inclusions multi-select catalog (grouped). */

export interface ProjectInclusionGroup {
  label: string
  items: readonly string[]
}

/**
 * Groups from client list. Headers with # are explicit groups.
 * Headers without # that introduce item lists are treated as groups too.
 * Empty groups (Flooring) expose the group title as the selectable item.
 */
export const PROJECT_INCLUSION_GROUPS: readonly ProjectInclusionGroup[] = [
  {
    label: 'Permits & Drawings',
    items: [
      'Architectural, Structural & Mechanical',
      'Sprinkler Drawings',
      'Structural Drawings',
      "City Fee's",
      'Key Sets & Keybox',
      'Design & Aesthetic Consultant',
    ],
  },
  {
    label: 'Demolition',
    items: [
      'Demo Bins',
      'Concrete & Fill Bins',
      'Casual Dump Runs',
      'General Cleaning of Space',
      'Storage Bin',
      'Moving of Equipment & Supplies',
      'Major Equipment Rentals',
    ],
  },
  {
    label: 'Structure',
    items: ['Block Wall Penetrations', 'Structural Changes'],
  },
  {
    label: 'Fire',
    items: [
      'Sprinkler Install (Supply & Install)',
      'Fire Separation Ceiling or Demising Walls',
      'Fire Alarm, Horns Install',
      'Fire Caulking Materials',
      'Penetrations',
    ],
  },
  {
    label: 'HVAC',
    items: ['HVAC New Units Install', 'New System', 'Thermostat', 'Venting Flashing'],
  },
  {
    label: "Plumbing Rough-In's & Finish",
    items: ['Plumbing Fixtures as per Contractor Grade'],
  },
  {
    label: 'Electrical',
    items: ['Electrical Rough In & Finish As Per Drawing', 'Electrical Decor Finishes'],
  },
  {
    label: 'Partitions As Per Drawing',
    items: [
      'Insulated Partitions',
      'Taping & Patching',
      'TV Inserts',
      "Corner Guards 4'",
      'Corner Guards Full Corner',
    ],
  },
  {
    label: 'Network',
    items: ['Network Lines Runs', 'Network Line Finish', 'Network Switch Finish'],
  },
  {
    label: 'Paint',
    items: ['Paint Entire Space', 'Epoxy Paint'],
  },
  {
    label: 'Doors',
    items: [
      'Solid Core Doors With Knockdown Frames',
      'Custom Doors & Frames',
      'Commercial Hardware',
      'Door Stoppers',
      'Barrier Free Bathroom Automation',
      'Entry/Exit Door Automation',
      'Interior Door Automation',
      'Bathroom Door Closers',
      'Door Closers',
    ],
  },
  {
    label: 'Ceiling',
    items: ['T-Bar Ceiling & Commercial Tiles', 'Sound Reduction Tiles'],
  },
  {
    label: 'Flooring As Per Drawing With Commercial Finishes',
    items: ['Flooring As Per Drawing With Commercial Finishes'],
  },
  {
    label: 'Cabinetry / Millwork - As Shown In Drawing',
    items: [
      'Autoclave Room',
      'Bathroom Vanity',
      'Benches',
      'Charting Room',
      'Diagnostic Room',
      'Doctors Lounge',
      'Exam Rooms',
      'Exercise Room',
      'Hallway Desk',
      'Hallway Storage',
      'Kitchen',
      'Managers Office',
      'Medical Reception',
      'Nursing',
      'Pharmacy',
      'Pharmacy Island',
      'Pharmacy Shelves',
    ],
  },
  {
    label: 'Finishes & Equipment Mounting',
    items: [
      'Adult Change Table',
      'Baby Change Table',
      'Barrier Free Equipment',
      'Coat Hangers',
      'Door Numbers',
      'Eye Wash Station',
      'Female Hygiene Dispenser',
      'Hand Paper Towel Dispensers',
      'Mirrors',
      'Pictures &/Or Artwork',
      'Soap Dispensers',
      'Toilet Paper Dispenser',
    ],
  },
  {
    label: 'Security',
    items: [
      'Support For Gate',
      'Pharmacy Security Gate',
      'Window Security Gate',
      'Windows Security Gate Install',
      'Install Security System',
      'Install Security Camera System',
    ],
  },
  {
    label: 'Baseboard & Trim',
    items: ['Baseboard', 'Commercial Finish Trim'],
  },
  {
    label: 'Design & Decor',
    items: [
      'Raised Platform',
      "Recessed TV's",
      'Welcome Mat',
      'Custom Wrapped Doors',
      'Tiled Walls',
      'Skylight Install',
      'Millwork Planter',
      'Custom Wood Wall',
      'Glass Work',
      'Metal Work',
      'Stone Work',
    ],
  },
  {
    label: 'Cleaning',
    items: ['Final Commercial Clean'],
  },
  {
    label: 'Branding',
    items: ['Branding Package', 'Way Finding', 'Door Numbers Installed'],
  },
  {
    label: 'Entertainment',
    items: ['Install Speaker System', 'TV Mounts', "TV's"],
  },
  {
    label: 'Signage',
    items: ['Exterior Primary Sign', 'Windows Signs', 'Pileon Sign'],
  },
]

export const PROJECT_INCLUSION_OPTIONS: readonly string[] = PROJECT_INCLUSION_GROUPS.flatMap(
  (group) => [...group.items],
)

export const PROJECT_INCLUSION_OPTION_SET = new Set<string>(PROJECT_INCLUSION_OPTIONS)

export function isProjectInclusionOption(value: string): boolean {
  return PROJECT_INCLUSION_OPTION_SET.has(value)
}

export function normalizeProjectInclusions(input: unknown): string[] {
  if (input == null || input === '') {
    return []
  }
  let list: unknown[] = []
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input) as unknown
      if (Array.isArray(parsed)) {
        list = parsed
      } else if (isProjectInclusionOption(input)) {
        return [input]
      }
    } catch {
      return isProjectInclusionOption(input) ? [input] : []
    }
  } else if (Array.isArray(input)) {
    list = input
  }
  const result: string[] = []
  for (const item of list) {
    if (typeof item === 'string' && isProjectInclusionOption(item) && !result.includes(item)) {
      result.push(item)
    }
  }
  return result
}

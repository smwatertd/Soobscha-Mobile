export type HelpRequestActionId =
  | 'cancel'
  | 'interrupt'
  | 'update'
  | 'start'
  | 'finish'
  | 'create_payout'
  | 'create_report'
  | 'confirm_relevance'
  | 'unknown';

export type HelpRequestActionButton = {
  id: HelpRequestActionId;
  raw: string;
  label: string;
  kind: 'primary' | 'secondary' | 'accent' | 'ghost';
  labelColor?: string;
  destructive?: boolean;
};

const ACTION_ALIASES: Record<string, HelpRequestActionId> = {
  cancel: 'cancel',
  cancel_help_request: 'cancel',
  interrupt: 'interrupt',
  interrupt_help_request: 'interrupt',
  update: 'update',
  edit: 'update',
  update_help_request: 'update',
  update_social_help_request: 'update',
  update_material_help_request: 'update',
  start: 'start',
  start_execution: 'start',
  start_social_help_request_execution: 'start',
  finish: 'finish',
  finish_execution: 'finish',
  finish_social_help_request_execution: 'finish',
  create_payout: 'create_payout',
  request_payout: 'create_payout',
  create_material_help_request_payout: 'create_payout',
  create_report: 'create_report',
  submit_report: 'create_report',
  create_social_help_request_report: 'create_report',
  create_material_help_request_report: 'create_report',
  confirm_relevance: 'confirm_relevance',
  confirm_social_help_request_relevance: 'confirm_relevance',
};

function normalizeKey(action: string): string {
  return action.trim().toLowerCase().replace(/-/g, '_');
}

function resolveActionId(action: string): HelpRequestActionId {
  const key = normalizeKey(action);
  if (ACTION_ALIASES[key]) return ACTION_ALIASES[key];

  if (key.includes('cancel')) return 'cancel';
  if (key.includes('interrupt')) return 'interrupt';
  if (key.includes('start') && key.includes('execution')) return 'start';
  if (key.includes('finish') && key.includes('execution')) return 'finish';
  if (key.includes('payout')) return 'create_payout';
  if (key.includes('report')) return 'create_report';
  if (key.includes('relevance')) return 'confirm_relevance';
  if (key.includes('update') || key.includes('edit')) return 'update';

  return 'unknown';
}

function humanizeAction(action: string): string {
  return action
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function labelForAction(id: HelpRequestActionId, isMaterial: boolean): string {
  switch (id) {
    case 'cancel':
      return isMaterial ? 'Отменить заявку' : 'Отменить';
    case 'interrupt':
      return 'Прервать сбор';
    case 'update':
      return 'Изменить';
    case 'start':
      return 'Начать встречу';
    case 'finish':
      return 'Встреча идёт';
    case 'create_payout':
      return 'Запросить выплату';
    case 'create_report':
      return 'Подать отчёт';
    case 'confirm_relevance':
      return 'Подтвердить актуальность';
    default:
      return 'Действие';
  }
}

export function mapAvailableActions(
  actions: string[] | undefined,
  isMaterial: boolean,
): HelpRequestActionButton[] {
  const seen = new Set<HelpRequestActionId>();
  const result: HelpRequestActionButton[] = [];

  for (const raw of actions ?? []) {
    const id = resolveActionId(raw);
    if (id !== 'unknown' && seen.has(id)) continue;
    if (id !== 'unknown') seen.add(id);

    const destructive = id === 'cancel' || id === 'interrupt';
    result.push({
      id,
      raw,
      label: id === 'unknown' ? humanizeAction(raw) : labelForAction(id, isMaterial),
      kind: destructive ? 'ghost' : id === 'create_payout' ? 'accent' : id === 'update' ? 'primary' : 'primary',
      labelColor: destructive ? '#C75653' : undefined,
      destructive,
    });
  }

  return result;
}

export function hasHeaderEditAction(actions: string[] | undefined): boolean {
  return mapAvailableActions(actions, false).some((action) => action.id === 'update');
}

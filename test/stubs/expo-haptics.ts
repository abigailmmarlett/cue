// Records haptics instead of playing them.
export const fired: string[] = [];

export const ImpactFeedbackStyle = { Light: 'light', Medium: 'medium', Heavy: 'heavy', Rigid: 'rigid', Soft: 'soft' };
export const NotificationFeedbackType = { Success: 'success', Warning: 'warning', Error: 'error' };

export async function impactAsync(style: string): Promise<void> {
  fired.push(style);
}
export async function notificationAsync(type: string): Promise<void> {
  fired.push(type);
}

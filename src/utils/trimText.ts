export const trimText = (nodeText: string): string => {
  return nodeText.replace(/\n/g, ' ')
    .slice(0, 50);
};

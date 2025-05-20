export enum RewardRuleType {
  PER_CONDITION = 'PER_CONDITION', // 조건을 만족시킬 때마다 보상
  STAGE = 'STAGE', // 누적 메트릭이 임계값을 초과할 때 보상
  FINAL = 'FINAL', // 모든 조건 만족시 보상
}

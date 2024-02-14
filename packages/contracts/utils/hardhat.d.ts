export type VerifyEntry = {
  address: string;
  args?: unknown[];
};

declare module 'hardhat/types' {
  interface HardhatRuntimeEnvironment {
    aragonToVerifyContracts: VerifyEntry[];
  }
}

// This are default mock values, you can can change them or
// add more if you need to
//
// To add more functions just add them to the mockedIPFSClient object
//
// If you want to reeturn a specific value for a function you can use
// jest.fn().mockResolvedValueOnce(value) inside your test
// this will return the specified value only once and then will return
// the default value

export const mockedIPFSClient = {
  nodeInfo: jest.fn().mockResolvedValue(true),
  add: jest.fn().mockResolvedValue({
    hash: 'QmXhJawTJ3PkoKMyF3a4D89zybAHjpcGivkb7F1NkHAjpo',
  }),
  cat: jest.fn().mockImplementation(async () => Buffer.from('{}')),
  pin: jest.fn().mockResolvedValue({
    pins: ['QmXhJawTJ3PkoKMyF3a4D89zybAHjpcGivkb7F1NkHAjpo'],
    progress: undefined,
  }),
  __proto__: {},
};

const mockedModuleStructure = {
  Client: function () {
    return mockedIPFSClient;
  },
};

// mocking the inheritance chain to bypass instanceOf checks
mockedIPFSClient.__proto__ = mockedModuleStructure.Client.prototype;

jest.mock('@aragon/sdk-ipfs', () => mockedModuleStructure);

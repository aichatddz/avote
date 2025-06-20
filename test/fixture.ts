import * as Util from "../component/util";
import hre from "hardhat";
import * as CircomLib from "circomlibjs";
import { bigint } from "hardhat/internal/core/params/argumentTypes";

// PublicKeyCircuit: 0x5bb54c5c11966492106ea1b8dce691f58b5f3fa9
// DecryptCircuit: 0xa6b401198ff094111692edbfbb7c958854a387a3
// VoterCircuit: 0x43e7ca2dd749da623d6c279e214422af617421fa
// CheckSumCircuit: 0x93fb05f8ffa5984d651d71849b84c190f00c0cf3

interface VoterTestValue {
  private: bigint;  // it's not used yet
  value: bigint;
  randomK: bigint;
  c1: Util.BigPoint;
  c2: Util.BigPoint;
}

interface CounterTestValue {
  private: bigint;
  // public: BigPoint;
  dMulC1: Util.BigPoint;
}

// deprecated
interface VoteInfo {
    candidates: readonly `0x${string}`[];
    voters: readonly `0x${string}`[];
    sponporEthers: bigint;
    state: number;
    counterPublicKeys: readonly Util.BigPoint[];
    ballots: readonly Util.BigCipher[];
    decryptPoints: readonly Util.BigPoint[];
    expiredBlock: bigint;
    sumPublicKey: Util.BigPoint;
    sumVotes: Util.BigCipher;
    tally: bigint[];
}

interface Voter {
    addr: `0x${string}`;
    state: number;
    ballot: Util.BigCipher;
    reversed: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
}

interface Counter {
    addr: `0x${string}`;
    publicKey: Util.BigPoint;
    state: number;
    decryption: Util.BigPoint;
    reversed: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
}

interface AcvivityInfo {
    expiredBlock: bigint;
    sponporStateAmount: bigint;
    counterStateAmount: bigint;
    state: number;
    sumPublicKey: Util.BigPoint;
    sumVotes: Util.BigCipher;
    candidates: readonly `0x${string}`[];
    voters: Voter[];
    counters: Counter[];
    tally: bigint[];
    reversed: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
}

const defaultReversed: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n];
const defaultReversedUint8: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n];

var testCandidates: readonly `0x${string}`[] = [
  '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
  '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
  '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
  '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
  '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720'
]

var testVoters: readonly `0x${string}`[] = [
  "0xBcd4042DE499D14e55001CcbB24a551F3b954096",
  "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",
  "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
  "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec",
  "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097"
]

var testCounterAddresses: `0x${string}`[] = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906",

]

var testCounterPublicKeys: readonly Util.BigPoint[] = [{
      x: 12850997157950850405723489739354319047062600787099111201744321248306482255143n,
      y: 14743751048901513658331640233977231163182936175196280839934763098776720590409n
  },{
      x: 5545411705471143187699633907300542638207246452368574276711215960752437953732n,
      y: 16565961326947122016967754573301214999120716741052680976847987077769175046719n
  },{
      x: 19379458244332873934242360953958021443826696883006783546738195684145713708094n,
      y: 10060294436525543204611718053921107805932965241803516374071343926591655898063n
}]

var testSumPublicKeys: Util.BigPoint = {
  x: 17562281052541849814619194517171420429774894242466780171322661757215271005933n,
  y: 5545643084915208416594058274347129551972220545965249783234145634433536213542n,
}

var testBallots: Util.BigCipher[] = [
  {
      c1: {
        x: 4927186078240140046265353961886559884626197109666961159300140392289670006231n,
        y: 8020290187704485342258828070343193949044353401393013934184033625253291783851n,
      },
      c2: {
        x: 19083987538829028673282403368901598055968029236498065058363377978426302770041n,
        y: 18660281074026560961400864479886810528407937225307750764843129059638521629567n,
      }
  },
  {
      c1: {
        x: 5950138701138748602872839146346803612147640892285571687315568280501474776667n,
        y: 19801382270819322338371924741668328091603279883798289397156548146655634279043n,
      },
      c2: {
        x: 13589964291845610848791535521090567770398304123938826017583933545911688095253n,
        y: 16606798178051635216502830264387250733532747181390794512030070870318549160940n,
      },
  },
  {
      c1: {
        x: 3547530953419371257734676976196493220667798891270180410274053106392379699126n,
        y: 2857669480309460825166048718616540765211657179603511183626401637573573564946n,
      },
      c2: {
        x: 20907447377522545921530930783850548058889083008400207238061327075033291929497n,
        y: 1200839157366345019904554208997337185615824333973113978371182705929190926298n,
      }
  },
  {
      c1: {
        x: 4187293818286361699895632992775746231568694846289580904069535219438641015339n,
        y: 17641463013099135835269526991334333119632839997477541661000959287658836165613n,
      },
      c2: {
        x: 16471623991026283057861128402741829534465673520100779978996526945631339632228n,
        y: 4067519820817272989320451942462841960090118492819494461200571410449060230076n,
      }
  },
  {
      c1: {
        x: 1972411620866860113407425005248654798556739856996899136222612442639314288355n,
        y: 1373356950687444176160227572558197519787106187137745243099578692387192387536n,
      },
      c2: {
        x: 3018037834336873101783709504254391326720989634158246004415108173654418961449n,
        y: 1554247510042427880954040536601220652888854535356741359257335040947074213743n,
      }
  }
]

var testSumBallots: Util.BigCipher = {
  c1: {
    x: 4581260430175070783408571085641532620249784736829700533832715250107242346585n,
    y: 14882391343821010434428845766509207672190941494785204334611706690448955976844n,
  },
  c2: {
    x: 14917025525114290118378953841926385649365912495167770989031725621388408165647n,
    y: 15593836521914121324642448374780850716472742902173988432535677009917669157029n,
  }
}

var testDecryptPoints: Util.BigPoint[] = [{
    x: 17586405391974699223143074723589877012749432494028331276422099265030666348654n,
    y: 16437489348796400388617656096621684919302650347297451868090043575543022655568n,
  },{
    x:21084389068483219027875384063746789633976695523374699817104638034976281328947n,
    y:2508542504771750605747188674486627963376873373636006411342463972362506706028n,
  },{
    x: 17450306543244095259989696499644199062146864895587615636847394954930251920914n,
    y: 1247813636160191280768694652694491180916599064873943164580769409637792978872n,
  },
]

const zeroPoint: Util.BigPoint = {x: 0n, y: 1n};

const COUNTER_STATE_NONE: number = 0;
const COUNTER_STATE_PUBLIC_KEY_SUBMITTED: number = 1;
const COUNTER_STATE_DECRYPTION_SUBMITTED: number = 2;

const VOTER_STATE_NONE: number = 0;
const VOTER_STATE_INIT: number = 1;
const VOTER_STATE_ENCRYPTION_SUBMITTED: number = 2;

export function InitiatedStateStart(): AcvivityInfo {
  const voters: Voter[] = [
    { addr: testVoters[0], ballot: {c1: zeroPoint, c2: zeroPoint}, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
    { addr: testVoters[1], ballot: {c1: zeroPoint, c2: zeroPoint}, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
    { addr: testVoters[2], ballot: {c1: zeroPoint, c2: zeroPoint}, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
    { addr: testVoters[3], ballot: {c1: zeroPoint, c2: zeroPoint}, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
    { addr: testVoters[4], ballot: {c1: zeroPoint, c2: zeroPoint}, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
  ]
  const counters: Counter[] = []
  return {
    expiredBlock: 11n,
    sponporStateAmount: 1n,
    counterStateAmount: 0n,
    state: 1,
    sumPublicKey: zeroPoint,
    sumVotes: {c1: zeroPoint, c2: zeroPoint},
    candidates: testCandidates,
    voters: voters,
    counters: counters,
    tally: [],
    reversed: defaultReversed,
  };
}

export function InitiatedStateEnd(): AcvivityInfo {
  const voters: Voter[] = [
    { addr: testVoters[0], ballot: {c1: zeroPoint, c2: zeroPoint}, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
    { addr: testVoters[1], ballot: {c1: zeroPoint, c2: zeroPoint}, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
    { addr: testVoters[2], ballot: {c1: zeroPoint, c2: zeroPoint}, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
    { addr: testVoters[3], ballot: {c1: zeroPoint, c2: zeroPoint}, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
    { addr: testVoters[4], ballot: {c1: zeroPoint, c2: zeroPoint}, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
  ]
  const counters: Counter[] = [
    {
      addr: testCounterAddresses[0],
      publicKey: testCounterPublicKeys[0],
      state: COUNTER_STATE_PUBLIC_KEY_SUBMITTED,
      decryption: zeroPoint,
      reversed: defaultReversedUint8,
    },
    {
      addr:testCounterAddresses[1],
      publicKey: testCounterPublicKeys[1],
      state: COUNTER_STATE_PUBLIC_KEY_SUBMITTED,
      decryption: zeroPoint,
      reversed: defaultReversedUint8,
    },
    {
      addr: testCounterAddresses[2],
      publicKey: testCounterPublicKeys[2],
      state: COUNTER_STATE_PUBLIC_KEY_SUBMITTED,
      decryption: zeroPoint,
      reversed: defaultReversedUint8,
    },
  ]
  return {
    expiredBlock: 11n,
    sponporStateAmount: 1n,
    counterStateAmount: 0n,
    state: 1,
    sumPublicKey: zeroPoint,
    sumVotes: {c1: zeroPoint, c2: zeroPoint},
    candidates: testCandidates,
    voters: voters,
    counters: counters,
    tally: [],
    reversed: defaultReversed,
  };
}

export function VotingStateStart(): AcvivityInfo {
  const voters: Voter[] = [
    { addr: testVoters[0], ballot: {c1: zeroPoint, c2: zeroPoint}, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
    { addr: testVoters[1], ballot: {c1: zeroPoint, c2: zeroPoint}, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
    { addr: testVoters[2], ballot: {c1: zeroPoint, c2: zeroPoint}, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
    { addr: testVoters[3], ballot: {c1: zeroPoint, c2: zeroPoint}, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
    { addr: testVoters[4], ballot: {c1: zeroPoint, c2: zeroPoint}, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
  ]
  const counters: Counter[] = [
    {
      addr: testCounterAddresses[0],
      publicKey: testCounterPublicKeys[0],
      state: COUNTER_STATE_PUBLIC_KEY_SUBMITTED,
      decryption: zeroPoint,
      reversed: defaultReversedUint8,
    },
    {
      addr:testCounterAddresses[1],
      publicKey: testCounterPublicKeys[1],
      state: COUNTER_STATE_PUBLIC_KEY_SUBMITTED,
      decryption: zeroPoint,
      reversed: defaultReversedUint8,
    },
    {
      addr: testCounterAddresses[2],
      publicKey: testCounterPublicKeys[2],
      state: COUNTER_STATE_PUBLIC_KEY_SUBMITTED,
      decryption: zeroPoint,
      reversed: defaultReversedUint8,
    },
  ]
  return {
    expiredBlock: 11n,
    sponporStateAmount: 1n,
    counterStateAmount: 0n,
    state: 2,
    sumPublicKey: testSumPublicKeys,
    sumVotes: {c1: zeroPoint, c2: zeroPoint},
    candidates: testCandidates,
    voters: voters,
    counters: counters,
    tally: [],
    reversed: defaultReversed,
  };
}

export function VotingStateEnd(): AcvivityInfo {
  const voters: Voter[] = [
    { addr: testVoters[0], ballot: testBallots[0], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
    { addr: testVoters[1], ballot: testBallots[1], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
    { addr: testVoters[2], ballot: testBallots[2], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
    { addr: testVoters[3], ballot: testBallots[3], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
    { addr: testVoters[4], ballot: testBallots[4], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
  ]
  const counters: Counter[] = [
    {
      addr: testCounterAddresses[0],
      publicKey: testCounterPublicKeys[0],
      state: COUNTER_STATE_PUBLIC_KEY_SUBMITTED,
      decryption: zeroPoint,
      reversed: defaultReversedUint8,
    },
    {
      addr:testCounterAddresses[1],
      publicKey: testCounterPublicKeys[1],
      state: COUNTER_STATE_PUBLIC_KEY_SUBMITTED,
      decryption: zeroPoint,
      reversed: defaultReversedUint8,
    },
    {
      addr: testCounterAddresses[2],
      publicKey: testCounterPublicKeys[2],
      state: COUNTER_STATE_PUBLIC_KEY_SUBMITTED,
      decryption: zeroPoint,
      reversed: defaultReversedUint8,
    },
  ]
  return {
    expiredBlock: 11n,
    sponporStateAmount: 1n,
    counterStateAmount: 0n,
    state: 2,
    sumPublicKey: testSumPublicKeys,
    sumVotes: {c1: zeroPoint, c2: zeroPoint},
    candidates: testCandidates,
    voters: voters,
    counters: counters,
    tally: [],
    reversed: defaultReversed,
  };
}

export function TallyingStateStart(): AcvivityInfo {
  const voters: Voter[] = [
    { addr: testVoters[0], ballot: testBallots[0], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
    { addr: testVoters[1], ballot: testBallots[1], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
    { addr: testVoters[2], ballot: testBallots[2], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
    { addr: testVoters[3], ballot: testBallots[3], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
    { addr: testVoters[4], ballot: testBallots[4], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
  ]
  const counters: Counter[] = [
    {
      addr: testCounterAddresses[0],
      publicKey: testCounterPublicKeys[0],
      state: COUNTER_STATE_PUBLIC_KEY_SUBMITTED,
      decryption: zeroPoint,
      reversed: defaultReversedUint8,
    },
    {
      addr:testCounterAddresses[1],
      publicKey: testCounterPublicKeys[1],
      state: COUNTER_STATE_PUBLIC_KEY_SUBMITTED,
      decryption: zeroPoint,
      reversed: defaultReversedUint8,
    },
    {
      addr: testCounterAddresses[2],
      publicKey: testCounterPublicKeys[2],
      state: COUNTER_STATE_PUBLIC_KEY_SUBMITTED,
      decryption: zeroPoint,
      reversed: defaultReversedUint8,
    },
  ]
  return {
    expiredBlock: 11n,
    sponporStateAmount: 1n,
    counterStateAmount: 0n,
    state: 3,
    sumPublicKey: testSumPublicKeys,
    sumVotes: testSumBallots,
    candidates: testCandidates,
    voters: voters,
    counters: counters,
    tally: [],
    reversed: defaultReversed,
  };
}

export function TallyingStateEnd(): AcvivityInfo {
  const voters: Voter[] = [
    { addr: testVoters[0], ballot: testBallots[0], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
    { addr: testVoters[1], ballot: testBallots[1], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
    { addr: testVoters[2], ballot: testBallots[2], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
    { addr: testVoters[3], ballot: testBallots[3], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
    { addr: testVoters[4], ballot: testBallots[4], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
  ]
  const counters: Counter[] = [
    {
      addr: testCounterAddresses[0],
      publicKey: testCounterPublicKeys[0],
      state: COUNTER_STATE_DECRYPTION_SUBMITTED,
      decryption: testDecryptPoints[0],
      reversed: defaultReversedUint8,
    },
    {
      addr:testCounterAddresses[1],
      publicKey: testCounterPublicKeys[1],
      state: COUNTER_STATE_DECRYPTION_SUBMITTED,
      decryption: testDecryptPoints[1],
      reversed: defaultReversedUint8,
    },
    {
      addr: testCounterAddresses[2],
      publicKey: testCounterPublicKeys[2],
      state: COUNTER_STATE_DECRYPTION_SUBMITTED,
      decryption: testDecryptPoints[2],
      reversed: defaultReversedUint8,
    },
  ]
  return {
    expiredBlock: 11n,
    sponporStateAmount: 1n,
    counterStateAmount: 0n,
    state: 3,
    sumPublicKey: testSumPublicKeys,
    sumVotes: testSumBallots,
    candidates: testCandidates,
    voters: voters,
    counters: counters,
    tally: [],
    reversed: defaultReversed,
  };
}

export function PublishedState(): AcvivityInfo {
  const voters: Voter[] = [
    { addr: testVoters[0], ballot: testBallots[0], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
    { addr: testVoters[1], ballot: testBallots[1], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
    { addr: testVoters[2], ballot: testBallots[2], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
    { addr: testVoters[3], ballot: testBallots[3], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
    { addr: testVoters[4], ballot: testBallots[4], state: VOTER_STATE_ENCRYPTION_SUBMITTED, reversed: defaultReversedUint8 },
  ]
  const counters: Counter[] = [
    {
      addr: testCounterAddresses[0],
      publicKey: testCounterPublicKeys[0],
      state: COUNTER_STATE_DECRYPTION_SUBMITTED,
      decryption: testDecryptPoints[0],
      reversed: defaultReversedUint8,
    },
    {
      addr:testCounterAddresses[1],
      publicKey: testCounterPublicKeys[1],
      state: COUNTER_STATE_DECRYPTION_SUBMITTED,
      decryption: testDecryptPoints[1],
      reversed: defaultReversedUint8,
    },
    {
      addr: testCounterAddresses[2],
      publicKey: testCounterPublicKeys[2],
      state: COUNTER_STATE_DECRYPTION_SUBMITTED,
      decryption: testDecryptPoints[2],
      reversed: defaultReversedUint8,
    },
  ]
  return {
    expiredBlock: 11n,
    sponporStateAmount: 1n,
    counterStateAmount: 0n,
    state: 4,
    sumPublicKey: testSumPublicKeys,
    sumVotes: testSumBallots,
    candidates: testCandidates,
    voters: voters,
    counters: counters,
    tally: [3n, 1n, 1n, 0n, 0n],
    reversed: defaultReversed,
  };
}

export async function deployFixture() {
    const accounts = await hre.viem.getWalletClients();
 
    const voteVerifier = await hre.viem.deployContract("contracts/circuit/vote_verifier.sol:Groth16Verifier", [], {});
    const publicKeyVerifier = await hre.viem.deployContract("contracts/circuit/public_key_verifier.sol:Groth16Verifier", [], {});
    const decryptVerifier = await hre.viem.deployContract("contracts/circuit/decrypt_verifier.sol:Groth16Verifier", [], {});
    const avote = await hre.viem.deployContract("AvoteForTest", [voteVerifier.address, publicKeyVerifier.address, decryptVerifier.address], {});

    const publicClient = await hre.viem.getPublicClient();
    const curve = await CircomLib.buildBabyjub();

    for (let i = 1; i <= 3; i++) {
      await avote.write.AddCounter([accounts[i].account.address]);
    }

    const counterTestValues: CounterTestValue[] = [
      {
        private: 735514173037608534735104653239571788205806618835123745487136276835914656619n,
        dMulC1: {
          x: 17586405391974699223143074723589877012749432494028331276422099265030666348654n,
          y: 16437489348796400388617656096621684919302650347297451868090043575543022655568n,
        }
      },
      {
        private: 632366879893181405087379695101455452961379375663675034682573978561129264084n,
        dMulC1: {
          x:21084389068483219027875384063746789633976695523374699817104638034976281328947n,
          y:2508542504771750605747188674486627963376873373636006411342463972362506706028n,
        }
      },
      {
        private: 2309680827062359428527157418503620910777834679952307807722172278573486636784n,
        dMulC1: {
          x: 17450306543244095259989696499644199062146864895587615636847394954930251920914n,
          y: 1247813636160191280768694652694491180916599064873943164580769409637792978872n,
        }
      },
    ]

    const voterPrivates: VoterTestValue[] = [
      {
        private: 2230359128765178667009492279002232690348502915904860098119029361924741268331n, 
        value: 1n, 
        randomK: 1186514429774673263045386838204114554872366147750302254896049112187317603883n,
        c1: {
          x: 4927186078240140046265353961886559884626197109666961159300140392289670006231n, 
          y: 8020290187704485342258828070343193949044353401393013934184033625253291783851n,
        },
        c2: {
          x: 5095231844120880793323863218492658424924250123359868729330699495771584066623n, 
          y: 18814646589350445839362184305043626641028853182367201556837650789424538027246n,
        }
      },
      {
        private: 2307068043429434355608527159120511283714965558313529488750141847727947338047n, 
        value: 2n, 
        randomK: 2304228914364770495375489776807601134895615849297190862334840635916175840578n,
        c1: {
          x: 5950138701138748602872839146346803612147640892285571687315568280501474776667n, 
          y: 19801382270819322338371924741668328091603279883798289397156548146655634279043n,
        },
        c2: {
          x: 19551798702234497938852910329658283315281403366597685922309994172137949210470n, 
          y: 9589002976014871039477560575267955571838388695098661656083909249518179935423n,
        }
      },
      {
        private: 169597424537300259879951871106718979281962930472519670071286047737098634808n, 
        value: 3n,
        randomK: 1733110834937671739964741288065960546195549429679506389541532944902961390217n,
        c1: {
          x: 3547530953419371257734676976196493220667798891270180410274053106392379699126n, 
          y: 2857669480309460825166048718616540765211657179603511183626401637573573564946n,
        },
        c2: {
          x: 14840281706620884291616083736499460613754174344028022110529763243226189716967n, 
          y: 8110729206842040793978065050878728181007374289365506282021599459075923132902n,
        }
      },
      {
        private: 475544391661551677346151511013601989982873960504037718549505370862099543606n, 
        value: 1n, 
        randomK:  1464192984160956163854823254075844836430673130662993778972848362882461520655n,
        c1: {
          x: 4187293818286361699895632992775746231568694846289580904069535219438641015339n, 
          y: 17641463013099135835269526991334333119632839997477541661000959287658836165613n,
        },
        c2: {
          x: 4316987542220216246928612834392827007342442537462770867984146788137032993646n, 
          y: 7100926374345897409515537554400069511635449901388748984630740068262828595085n,
        }
      },
      {
        private: 546372505267749274698143840508932057256023889190772591914061187395605296852n, 
        value: 1n, 
        randomK: 842073200858079431488570481041966272275065633623425498337949642654812475648n,
        c1: {
          x: 1972411620866860113407425005248654798556739856996899136222612442639314288355n, 
          y: 1373356950687444176160227572558197519787106187137745243099578692387192387536n,
        },
        c2: {
          x: 8264426594767412502559006948788934129853133604300385464975597675885461845939n, 
          y: 690409446320898477308298715348859559171807148545752497181437933949644695629n,
        }
      }
    ]
    const voteId = Util.randomScalar(curve);

    return { curve, avote, counterTestValues, voterPrivates, voteId, accounts, publicClient };
}

// function initVoters(): Voter[] {
//   return [
//     { addr: testVoters[0], ballot: zeroPoint, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
//     { addr: testVoters[1], ballot: zeroPoint, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
//     { addr: testVoters[2], ballot: zeroPoint, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
//     { addr: testVoters[3], ballot: zeroPoint, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
//     { addr: testVoters[4], ballot: zeroPoint, state: VOTER_STATE_INIT, reversed: defaultReversedUint8 },
//   ]
// }
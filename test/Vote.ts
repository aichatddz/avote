import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { ethers, toBigInt } from "ethers";
import { buildBabyjub, Point, BabyJub } from "circomlibjs";
import { Prover, Voter, SubmitPublicKey, Decrypt } from "../component/prover";
import { toBytes, fromBytes, NonceTooLowError } from 'viem'
import { decrypt, sumPoints, BigPoint, Cipher, toPoint, sumBigPoints, decode, toBigPoint } from "../component/util";

interface VoterTestValue {
  private: bigint;  // it's not used yet
  value: number;
  randomK: bigint;
  c1: BigPoint;
  c2: BigPoint;
}

interface CounterTestValue {
  private: bigint;
  // public: BigPoint;
}

describe("Verifier", function () {
  async function deployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    const voteVerifier = await hre.viem.deployContract("contracts/circuit/vote_verifier.sol:Groth16Verifier", [], {});
    const publicKeyVerifier = await hre.viem.deployContract("contracts/circuit/publickey_verifier.sol:Groth16Verifier", [], {});
    const decryptVerifier = await hre.viem.deployContract("contracts/circuit/decrypt_verifier.sol:Groth16Verifier", [], {});
    const avote = await hre.viem.deployContract("Voter", [voteVerifier.address, publicKeyVerifier.address, decryptVerifier.address], {});

    const publicClient = await hre.viem.getPublicClient();
    const curve = await buildBabyjub();

    const counterTestValues: CounterTestValue[] = [
      {
        private: 5111791321839995612998814389345637054499093359564416875491757815117927907641n,
      },
      {
        private: 8210300147052601658608945551383277467688394719712126374785156317380012298333n,
      },
      {
        private: 10253883521808019204853708370069688980921908910512304424237432623098941967830n,
      },
      
    ]

    const voterPrivates: VoterTestValue[] = [
      {
        private: 20370798288242394938689504943432527754099834028485648598605186590553752959037n, 
        value: 1, 
        randomK: 67079482866500646697225352464400270624492576975366108791671756874571975976872n,
        c1: {
          x: 13882129766673914819315835128202114186131666894869411466642414187108224332660n, 
          y: 13335106409991193569613414182379451926071511491593253299049136165872381078096n,
        },
        c2: {
          x: 20844957933233677770123872057147676636703423818884654044177910231341924705116n, 
          y: 13337507112514555882273983920573005578315270031751351709327590035961754208533n,
        }
      },
      {
        private: 12884411294290685209386664860919401511751857927257478869140036137585734083445n, 
        value: 2, 
        randomK: 17835474572774057414336701045494047242035597391464900778986116369737103578455n,
        c1: {
          x: 15961634567597077440462938659312561057200719717915388435864047651443351890375n, 
          y: 10421749904837597717825667207281809396233018752697641841417863237492354073400n,
        },
        c2: {
          x: 309688804331586934153681094749121533152585786437150586346082134909190097339n, 
          y: 13931461524814893764393460149167716879249643663495857471219690501926660224600n,
        }
      },
      {
        private: 15703450778934838316231407256434952369555537581875256784554603671038508238882n, 
        value: 3, 
        randomK: 80657108244412898844588955050028970073457780793475885891088901651391309605813n,
        c1: {
          x: 11038207550521658525540575142057671301256210785917603716165851346941626449827n, 
          y: 21358876383527117165113719753942633581144296463118554672653446898799196280517n,
        },
        c2: {
          x: 7575562902182734554391382889322524383481468728584454103705777142243392946188n, 
          y: 18793125823684272921197120933155159539240988946120238645978991620609574628581n,
        }
      },
      {
        private: 5185742993399676352351115442031149865274169968414382443904998735035994630046n, 
        value: 1, 
        randomK:  80548485025929527258815417156597214526476344122307023067707888612331034415118n,
        c1: {
          x: 3959271618542864270771411051938791945679431178300571504981668581911042413445n, 
          y: 11038265322362397418737169148611976037992384622415931210434998844318967881107n,
        },
        c2: {
          x: 6931919454640985993043862485006345960950478794122322888641094792554198644424n, 
          y: 4853349369144649224761301982377355534429098863960925550436763710423389123402n,
        }
      },
      {
        private: 17177228977949452824343559953919499021606434946676877657016719901447669568213n, 
        value: 1, 
        randomK: 69346402117692181947841247732282641618627498848551575269589545522410986911213n,
        c1: {
          x: 2084134891444046623206552595156399156180911094734596782465300020889260096595n, 
          y: 4412006921640638745798436653640280246418710279332373259904259531319341275670n,
        },
        c2: {
          x: 12799836346909951340089617348788010154517314608210645823234121132083671718467n, 
          y: 18933170033412225696328022587321456455873683907778776226979671046236948487001n,
        }
      }
    ]
    const expectPublicKey: Point = [
      curve.F.e(10981563598801205623359592314677833300087079990999938873324121769192133307962n.toString()),
      curve.F.e(6300402212863780602412389550578979668773005062754014312139548457863915860054n.toString()),
    ];

    const sumCipher: Cipher = {
      c1: [curve.F.e(18629587583109758222956856306882325145673860087269427350730526597800224619601n.toString()), curve.F.e(683480845838943359639168620445058004464864819757064769093498759713289221902n.toString())],
      c2: [curve.F.e(5617719615934595255789095923548416599813172291655663707339912450845434531886n.toString()), curve.F.e(13349838211921327038632543657684949518109877368565995020499265887914442115787n.toString())],
    }
    return { curve, avote, counterTestValues, voterPrivates, expectPublicKey, sumCipher, owner, otherAccount, publicClient };
  }

  it("Should create the right random vote", async function () {
    const fixture = await loadFixture(deployFixture);
    const q: Point = fixture.expectPublicKey;  // public key
    const v = 3;  // vote value

    let prover = new Voter(null);
    const proof = await prover.prove({
      publicKey: q,
      value: v,
    });

    const rsp = await fixture.avote.write.Vote(proof);

    await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
    const voteEvents = await fixture.avote.getEvents.VoteLog();
    expect(voteEvents).to.have.lengthOf(1);
  })

  it("Should add the right votes", async () => {
    const fixture = await loadFixture(deployFixture);
    // test the event
    for (let i in fixture.voterPrivates) {
      let prover = new Voter(fixture.voterPrivates[i].randomK);
      const proof = await prover.prove({
        publicKey: fixture.expectPublicKey,
        value: fixture.voterPrivates[i].value,
      });  
      const rsp = await fixture.avote.write.Vote(proof);
      await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
      const voteEvents = await fixture.avote.getEvents.VoteLog();
      expect(voteEvents).to.have.lengthOf(1);
      expect(voteEvents[0].args[0]?.cipher.c1).to.deep.equals(fixture.voterPrivates[i].c1);
      expect(voteEvents[0].args[0]?.cipher.c2).to.deep.equals(fixture.voterPrivates[i].c2);
    }
    // test the contract storage
    const votes = await fixture.avote.read.Votes();
    expect(votes).to.have.lengthOf(fixture.voterPrivates.length);
    for (let i in fixture.voterPrivates) {
      expect(votes[i].c1).to.deep.equals(fixture.voterPrivates[i].c1);
      expect(votes[i].c2).to.deep.equals(fixture.voterPrivates[i].c2);
    }

    // test the sum of c1 and the sum of c2
    const c1s: Point[] = [];
    const c2s: Point[] = [];
    for (let i in fixture.voterPrivates) {
      c1s.push(toPoint(fixture.curve, fixture.voterPrivates[i].c1));
      c2s.push(toPoint(fixture.curve, fixture.voterPrivates[i].c2));
    }
    const sumCipher: Cipher = {
      c1: sumPoints(fixture.curve, c1s),
      c2: sumPoints(fixture.curve, c2s),
    }
    expect(sumCipher).to.deep.equals(fixture.sumCipher);

    // test decrypt for every counter
    for (let i in fixture.counterTestValues) {
      let prover = new Decrypt();
      const proof = await prover.prove({
        privateKey: fixture.counterTestValues[i].private,
        publicKey: fixture.curve.mulPointEscalar(fixture.curve.Base8, fixture.counterTestValues[i].private),
        c1: sumCipher.c1,
      });
      const rsp = await fixture.avote.write.Decrypt(proof);

      await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
      const decryptEvents = await fixture.avote.getEvents.DecryptLog();
      expect(decryptEvents).to.have.lengthOf(1);
    }

    const decryptPoints = await fixture.avote.read.DecryptPoints();
    const sumDecrypt = sumBigPoints(fixture.curve, decryptPoints);
    const plainPoint = decode(fixture.curve, sumDecrypt, toBigPoint(sumCipher.c2));

    let expectPlain: Point = fixture.curve.mulPointEscalar(fixture.curve.Base8, 8);
    expect(plainPoint).to.deep.equals(toBigPoint(expectPlain));

  })

  it("Should add the right random public key", async function() {
    const fixture = await loadFixture(deployFixture);
    const privateKey: bigint = randomOrder(fixture.curve.order);
    let prover = new SubmitPublicKey();
    const proof = await prover.prove({
        privateKey: privateKey,
    });

    const rsp = await fixture.avote.write.SubmitPublicKey(proof);

    await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
    const voteEvents = await fixture.avote.getEvents.SubmitPublicKeyLog();
    expect(voteEvents).to.have.lengthOf(1);
  })

  it("Should add the right multi-public key", async function () {
    const fixture = await loadFixture(deployFixture);

    let prover = new SubmitPublicKey();
    for (let i = 0; i < fixture.counterTestValues.length; i++) {
      const proof = await prover.prove({
        privateKey: fixture.counterTestValues[i].private,
      });
      const rsp = await fixture.avote.write.SubmitPublicKey(proof);
      await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
      const voteEvents = await fixture.avote.getEvents.SubmitPublicKeyLog();
      expect(voteEvents).to.have.lengthOf(1);
    }

    const publicKeys = await fixture.avote.read.CounterPublicKeys()
    let publicKeyPoints: Point[] = [];
    for (let i = 0; i < publicKeys.length; i++) {
      publicKeyPoints.push([
        fixture.curve.F.e(publicKeys[i].x.toString()),
        fixture.curve.F.e(publicKeys[i].y.toString()),
      ])
    }
    const publicKey = await sumPoints(fixture.curve, publicKeyPoints);
    expect(publicKey).to.deep.equals(fixture.expectPublicKey);
  })

  it("Should add the right decryption", async function() {
    const fixture = await loadFixture(deployFixture);
    const privateKey: bigint = randomOrder(fixture.curve.order);
    const publicKey: Point = fixture.curve.mulPointEscalar(fixture.curve.Base8, privateKey);
    const k: bigint = randomOrder(fixture.curve.order);
    const c1: Point = fixture.curve.mulPointEscalar(fixture.curve.Base8, k);

    let prover = new Decrypt();
    const proof = await prover.prove({
      privateKey: privateKey,
      publicKey: publicKey,
      c1: c1,
    });

    const rsp = await fixture.avote.write.Decrypt(proof);

    await fixture.publicClient.waitForTransactionReceipt({hash: rsp});
    const voteEvents = await fixture.avote.getEvents.DecryptLog();
    expect(voteEvents).to.have.lengthOf(1);

    let dMulC1 = fixture.curve.mulPointEscalar(c1, privateKey);
    expect(voteEvents[0].args).to.deep.equals( [{
        x: ethers.toBigInt(fixture.curve.F.toString(dMulC1[0])),
        y: ethers.toBigInt(fixture.curve.F.toString(dMulC1[1])),
    }]);
  })

});

function randomOrder(modular: bigint): bigint {
  return ethers.toBigInt(ethers.randomBytes(32)) % modular;
}
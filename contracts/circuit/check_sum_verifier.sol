// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 10805073067656763766305001355992641184701882923040728821441197292517252736072;
    uint256 constant alphay  = 10904576993224059097769974540397836167726046986339108265829190483512351326889;
    uint256 constant betax1  = 3767469376297154947524201479705222750096804702701871255758568867620877892558;
    uint256 constant betax2  = 3644530909066874667609755339070749143765068488005956348647222945220499336435;
    uint256 constant betay1  = 6638924350247088602456160566444651921137290269799736958459965640323658781686;
    uint256 constant betay2  = 11511851617482161128447400252274932887858849706573145432154614378047505684631;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 2998061538024373072712915806079868993964869399212390465378726143999980161428;
    uint256 constant deltax2 = 13265822447558295033588910127749255557110096924552637971876571229621290656365;
    uint256 constant deltay1 = 15991180316333614592601749976714314636535821858832047558164319933338180826750;
    uint256 constant deltay2 = 2945144821091607777434247768960145038595680609412272971243210340122797910985;

    
    uint256 constant IC0x = 5838474995861266460737385424035424110872586491574223763760973883088203531217;
    uint256 constant IC0y = 669578463932791290590499461029251791754377193156705383078739496471523465104;
    
    uint256 constant IC1x = 2930564663963049672826662178451843018056937519576761915162742728359989852310;
    uint256 constant IC1y = 20828287290935337937577940409304029166262530364231776655951046853092587925648;
    
    uint256 constant IC2x = 5592030182755501317030721588020684729330266802595744299718444162736536573721;
    uint256 constant IC2y = 5793369513213695559030924230598961058669959625722234096938150463321331779345;
    
    uint256 constant IC3x = 21647504831249917624172048757718228301332245966889278367019566723823033674537;
    uint256 constant IC3y = 7061870676226235540602884722192628880461945846919808303702037684940661171764;
    
    uint256 constant IC4x = 16490182413733274776075521106671370056168125132236783919466770265800717394113;
    uint256 constant IC4y = 17746686625144173172606132402020773128676245422012865110874259328534114013156;
    
    uint256 constant IC5x = 13485034257273581762133155666742436795624975317284870431243677555689560462699;
    uint256 constant IC5y = 4758280575888643189240291175536852960347107357365036472648743331996182128066;
    
    uint256 constant IC6x = 9264596908793651979821001038152314026092477784061745511757272846162638656627;
    uint256 constant IC6y = 4219011332499234548221128706295347073768843905954699010490738537655272072459;
    
    uint256 constant IC7x = 9528930640287224077248709748960178587178844838050314634143370309923713250335;
    uint256 constant IC7y = 4998125550478047100148648259859888631667391080349843018349885084627336364272;
    
    uint256 constant IC8x = 19753718865624912973779747635829789328085368322007045603822620514428189842297;
    uint256 constant IC8y = 12361602656507454147503612694965568659354548493171436644690746662079310647937;
    
    uint256 constant IC9x = 4719612691056629846512789677714988732868498267605738212985927237778251518227;
    uint256 constant IC9y = 7227934312563544763889492614350153132574592374449738438449712538637889993600;
    
    uint256 constant IC10x = 20627991712302030282692180083995868448331073241712917798473528809886547827368;
    uint256 constant IC10y = 2738415826103539712630370249190584663210230304523283402039365293504243646075;
    
    uint256 constant IC11x = 12661627515090411709097363776827052065220609031712019163984060791414709790308;
    uint256 constant IC11y = 7001152002338830711560710073253729752415134987746121893330799141010265132504;
    
    uint256 constant IC12x = 2100305272123505672696177735015428495442185492825917374489529435074394729139;
    uint256 constant IC12y = 9745774337725150221147549150120298925042517412287701334874848262322826477562;
    
    uint256 constant IC13x = 14445301560643145798770178628344694133412790929798234609957907675548474763284;
    uint256 constant IC13y = 20809182656892270299083316894095580146073190818708366673849493314172330895025;
    
    uint256 constant IC14x = 16729700488025194561469773424515531301090953885299450388933396238781719726747;
    uint256 constant IC14y = 4718594861963035602680426459699886688262069712512521799055789076657518107057;
    
    uint256 constant IC15x = 5187432637033091294138624265891850980370810511695695079975345335454553465554;
    uint256 constant IC15y = 14956992947838938776069480503387796556466178872611842538709308525016728848489;
    
    uint256 constant IC16x = 15090392825009185598589940659582548604806784622652511067699130358266226452447;
    uint256 constant IC16y = 10735081140901428947506294635923668916602423019832017290018798408994374507069;
    
    uint256 constant IC17x = 8268554383671007908270733990776008822282420926547943774278049413163327331352;
    uint256 constant IC17y = 18101525130686159363110927838486225638744745450047551122465961557776050475591;
    
    uint256 constant IC18x = 14902066248631967388405336096190670548728967183410687045353539916288389147763;
    uint256 constant IC18y = 9079456685351178616778975580935062155200678406784024421901776146729146020617;
    
    uint256 constant IC19x = 1528774297763642731426639483450094636570237726047457043568008931765645479937;
    uint256 constant IC19y = 18508802404434287085482249879992032243865605540567940189207468026716718515120;
    
    uint256 constant IC20x = 19251140421380643021133004469846580331748970136891182047731823131803435813182;
    uint256 constant IC20y = 8152487098939338113878232913695937378858098470364580238511472397801663027568;
    
    uint256 constant IC21x = 19006375125396370322938595217861016850453132649132307635601942962737231222593;
    uint256 constant IC21y = 18144555919168401691894487240999020565583157786216553898764267857637402640065;
    
    uint256 constant IC22x = 1149771777662096788834811108757464144309021611557927662265317812974599323611;
    uint256 constant IC22y = 3280356471562256822189247065244122360462144164903075126411469851489679755454;
    
    uint256 constant IC23x = 20968454527180133137426433995685557652579914879152336155095880379187889126862;
    uint256 constant IC23y = 9319924149458124964485407128320048479172683142372441229773916288807589448829;
    
    uint256 constant IC24x = 13689625570155541071319043630034007347832006910370214879441778740497967513615;
    uint256 constant IC24y = 5747350738897060096990349395261174498286886106029582631858953232456673522392;
    
    uint256 constant IC25x = 10355526152030422867068482860019574581784504171633338005295337842619255103210;
    uint256 constant IC25y = 5983874241185087996004128837862753566527738995419511165074820661981696422587;
    
    uint256 constant IC26x = 21642504173225916489158965674814273602359837019114678534312612884454243257795;
    uint256 constant IC26y = 3571620140630231630295120137515154075430079469078726535527249706083035908155;
    
    uint256 constant IC27x = 18692672030649510800267639570766556271531387663524163393026334939704531684200;
    uint256 constant IC27y = 17025463940101515730588416478334879081721341200015648059875793300383791566899;
    
    uint256 constant IC28x = 750602169279339434234349988934208084756869499450231083804608856771518651937;
    uint256 constant IC28y = 13963608042794423149188827069335698064212959738214609382437437345813625493120;
    
    uint256 constant IC29x = 19978454379384209951301872503264687975800705325718410213298691968029182606742;
    uint256 constant IC29y = 12240361647217196002228116072304851164179551201404680920137205148739035896342;
    
    uint256 constant IC30x = 4962776111995477644517251593066243255256275471000591076837900399135459809919;
    uint256 constant IC30y = 13252356067652352642980428902912393355939556505698961263142410680794697061864;
    
    uint256 constant IC31x = 3775762812247129181797308149048871958104999434652994718875145101714169515850;
    uint256 constant IC31y = 19806834463636571351510825626965991200431810795031393642298415303667747225847;
    
    uint256 constant IC32x = 21652917713239836251628400838741748437700216873306178000453030016386785788760;
    uint256 constant IC32y = 13834124211091743367628902352342786950216675769703877348780166246515593396395;
    
    uint256 constant IC33x = 9017843834356749992951412009873827868847395091108964847335606055790664799616;
    uint256 constant IC33y = 17826329762509644090542593780619463251546128902338944294436534480714017517773;
    
    uint256 constant IC34x = 9992248107797558947707297108329396845757306197359355821398413728243827914139;
    uint256 constant IC34y = 2405024686111972774265029620778655087831499602694953351950882446964630233849;
    
    uint256 constant IC35x = 5677073391176806010507087981078831553580879438211760134520134762844257968288;
    uint256 constant IC35y = 15256795674773459125416133128454105369692586130642314170839642271234416462140;
    
    uint256 constant IC36x = 8742532984507686549393647786843534398588526053978361660860780813921193871952;
    uint256 constant IC36y = 1801942581707763468954706597701336070330442677898653310788833249748761425101;
    
    uint256 constant IC37x = 16591202580809844347602218496080005908390869986771190954195403332771056114759;
    uint256 constant IC37y = 18177502902882966486917680862758151479361650954036217413045291730408628186618;
    
    uint256 constant IC38x = 8201937562115082205432855948699353218548450561638483171214866353002313586233;
    uint256 constant IC38y = 16218023359091363211346621115425378939145898437638649074320662204290186278540;
    
    uint256 constant IC39x = 1335546155760994344439297690773314482786483966242136739687365243220482088794;
    uint256 constant IC39y = 6195259503243617099445089096217944934137634809547890188760676164488379627108;
    
    uint256 constant IC40x = 10393357387630257070535429591160910073250177868677331433262622596289249075900;
    uint256 constant IC40y = 14371011916321368458936219030075152471406510636091348219594112495844312488778;
    
    uint256 constant IC41x = 21665696010021513488882867232678860972458514290860314024407365599838909341129;
    uint256 constant IC41y = 12911838931901911844323783868943511898107956014274131891544995173921240398813;
    
    uint256 constant IC42x = 2284111221917082162980656410583151848456704923505408177923640065835461374904;
    uint256 constant IC42y = 1488400016625010690311905931065503260691488377560899773944815646962633797238;
    
    uint256 constant IC43x = 5325054790325181853772558054680351559464008280259738152978775631667191401454;
    uint256 constant IC43y = 14545127131741362084903843260554570211165281727653458406324424877253963860067;
    
    uint256 constant IC44x = 12792232744375421821237081388842882006580506543860790343965213855335608615930;
    uint256 constant IC44y = 16960964297168515186496276054240766817882723658224720218874954303123515792635;
    
    uint256 constant IC45x = 14527055275554979128731267086165059520416612545279857082280911483103576468657;
    uint256 constant IC45y = 8507125280979194048999521631613280524086641463318412775025852647196062503760;
    
    uint256 constant IC46x = 3586334602285635510036838429270161266825624401606182281565982995647592200983;
    uint256 constant IC46y = 1251338249069909150942436219378752666381738346132652153895006370249484072824;
    
    uint256 constant IC47x = 9461579337392208738177731379990088531073530117896149750977873900635744866562;
    uint256 constant IC47y = 10424187246097089185598792741320083536753827064422892612674548815289071537306;
    
    uint256 constant IC48x = 14555199810504950178112725596121041696891754675009775689516891775566773227714;
    uint256 constant IC48y = 12752127645688139485902160129373836501556764285954947454808799344122987985370;
    
    uint256 constant IC49x = 18952052615745205448580763762763917779486909990933458621905181459475441931008;
    uint256 constant IC49y = 18132045713684573327015381642503329906611488748530630339406973509350126915431;
    
    uint256 constant IC50x = 20608014309166252577227099354843672616511513144762666057564112000236991768226;
    uint256 constant IC50y = 7587451390971553018021384503724928368604833081459206894366790828996005720391;
    
    uint256 constant IC51x = 881201181202696189643941444842897110189936177525418252061307898472608091914;
    uint256 constant IC51y = 1407366606173382402477709568133871103626489747920938970432579604433858365349;
    
    uint256 constant IC52x = 15682894927646682149517693657744826689801288729583688406285629383958884403142;
    uint256 constant IC52y = 10880953330446979517512313750857603368214479204732437162724390471807002630000;
    
    uint256 constant IC53x = 3588139903544386240785309383335955345133720801096795965855600602749722789391;
    uint256 constant IC53y = 4185446868466530888527412043718572429195105938048964317008290331795034996287;
    
    uint256 constant IC54x = 9339136374934407196249798802094236187386042558714289886713681137040398378236;
    uint256 constant IC54y = 2499365720472087939764254346608846761754113325403837694246501907682607948380;
    
    uint256 constant IC55x = 3982884518983063939372989946180152869693305884253923983456392678594491047540;
    uint256 constant IC55y = 11720430151949098002067813697438059471665221089021518338739035766914402175140;
    
    uint256 constant IC56x = 17466367310806795000842450344962897862989345246705837017830084786213587636615;
    uint256 constant IC56y = 18120901366109737321038299701110813872404554187762455439649246701597221556409;
    
    uint256 constant IC57x = 3026959858080098811472623375556212979648961200917778111414499883299930075304;
    uint256 constant IC57y = 19855352401636101584228376707296365166702998560211416415302543144677445440433;
    
    uint256 constant IC58x = 15837327245780546333528397645876292939377759667717045289745277667261073113535;
    uint256 constant IC58y = 20510975283515468316781736759539404306104101987098121230519924343522049346831;
    
    uint256 constant IC59x = 17524585112076872978581588263909575149626385282785038119504733935578660128343;
    uint256 constant IC59y = 2945161711014379295407147276038802407468796100791473875338113899161372605724;
    
    uint256 constant IC60x = 7611791555201092995599816689417938860492981504363051853635380256731764186428;
    uint256 constant IC60y = 9954250290497647937517649121244706115653810059600534593316309492554962420740;
    
    uint256 constant IC61x = 6007397668373024465793730847147576280109768674208224695958219906664315354594;
    uint256 constant IC61y = 16938088337563194715760047119020270743196752622253759029509847557483782486437;
    
    uint256 constant IC62x = 14068616753021707106721484797941045038045463721753106773281903188192486452747;
    uint256 constant IC62y = 998341422843934676000674702983889078886124638843857411421391433764924596754;
    
    uint256 constant IC63x = 21768245787778797928621946299876278280006799339133589073713348789968777661747;
    uint256 constant IC63y = 19955680860494762685470647885733838068089159327861540577840554807944455810852;
    
    uint256 constant IC64x = 6606556978406379642898468225892077890415194320519470429770580245968530694683;
    uint256 constant IC64y = 19648119809874471096577730124325374825969009303644337298126140416540554021101;
    
    uint256 constant IC65x = 9237088890240290682769900833200912442207060038027727200201679580824880750637;
    uint256 constant IC65y = 10361989538750727328711279691766192907419536140643282878192585177997582933880;
    
    uint256 constant IC66x = 18790297948073958854988077726867959227850965199155032794415659279288593203686;
    uint256 constant IC66y = 5608915086757044026314417994165371884463688729792309024709302372312076068275;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[66] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                
                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))
                
                g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))
                
                g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))
                
                g1_mulAccC(_pVk, IC21x, IC21y, calldataload(add(pubSignals, 640)))
                
                g1_mulAccC(_pVk, IC22x, IC22y, calldataload(add(pubSignals, 672)))
                
                g1_mulAccC(_pVk, IC23x, IC23y, calldataload(add(pubSignals, 704)))
                
                g1_mulAccC(_pVk, IC24x, IC24y, calldataload(add(pubSignals, 736)))
                
                g1_mulAccC(_pVk, IC25x, IC25y, calldataload(add(pubSignals, 768)))
                
                g1_mulAccC(_pVk, IC26x, IC26y, calldataload(add(pubSignals, 800)))
                
                g1_mulAccC(_pVk, IC27x, IC27y, calldataload(add(pubSignals, 832)))
                
                g1_mulAccC(_pVk, IC28x, IC28y, calldataload(add(pubSignals, 864)))
                
                g1_mulAccC(_pVk, IC29x, IC29y, calldataload(add(pubSignals, 896)))
                
                g1_mulAccC(_pVk, IC30x, IC30y, calldataload(add(pubSignals, 928)))
                
                g1_mulAccC(_pVk, IC31x, IC31y, calldataload(add(pubSignals, 960)))
                
                g1_mulAccC(_pVk, IC32x, IC32y, calldataload(add(pubSignals, 992)))
                
                g1_mulAccC(_pVk, IC33x, IC33y, calldataload(add(pubSignals, 1024)))
                
                g1_mulAccC(_pVk, IC34x, IC34y, calldataload(add(pubSignals, 1056)))
                
                g1_mulAccC(_pVk, IC35x, IC35y, calldataload(add(pubSignals, 1088)))
                
                g1_mulAccC(_pVk, IC36x, IC36y, calldataload(add(pubSignals, 1120)))
                
                g1_mulAccC(_pVk, IC37x, IC37y, calldataload(add(pubSignals, 1152)))
                
                g1_mulAccC(_pVk, IC38x, IC38y, calldataload(add(pubSignals, 1184)))
                
                g1_mulAccC(_pVk, IC39x, IC39y, calldataload(add(pubSignals, 1216)))
                
                g1_mulAccC(_pVk, IC40x, IC40y, calldataload(add(pubSignals, 1248)))
                
                g1_mulAccC(_pVk, IC41x, IC41y, calldataload(add(pubSignals, 1280)))
                
                g1_mulAccC(_pVk, IC42x, IC42y, calldataload(add(pubSignals, 1312)))
                
                g1_mulAccC(_pVk, IC43x, IC43y, calldataload(add(pubSignals, 1344)))
                
                g1_mulAccC(_pVk, IC44x, IC44y, calldataload(add(pubSignals, 1376)))
                
                g1_mulAccC(_pVk, IC45x, IC45y, calldataload(add(pubSignals, 1408)))
                
                g1_mulAccC(_pVk, IC46x, IC46y, calldataload(add(pubSignals, 1440)))
                
                g1_mulAccC(_pVk, IC47x, IC47y, calldataload(add(pubSignals, 1472)))
                
                g1_mulAccC(_pVk, IC48x, IC48y, calldataload(add(pubSignals, 1504)))
                
                g1_mulAccC(_pVk, IC49x, IC49y, calldataload(add(pubSignals, 1536)))
                
                g1_mulAccC(_pVk, IC50x, IC50y, calldataload(add(pubSignals, 1568)))
                
                g1_mulAccC(_pVk, IC51x, IC51y, calldataload(add(pubSignals, 1600)))
                
                g1_mulAccC(_pVk, IC52x, IC52y, calldataload(add(pubSignals, 1632)))
                
                g1_mulAccC(_pVk, IC53x, IC53y, calldataload(add(pubSignals, 1664)))
                
                g1_mulAccC(_pVk, IC54x, IC54y, calldataload(add(pubSignals, 1696)))
                
                g1_mulAccC(_pVk, IC55x, IC55y, calldataload(add(pubSignals, 1728)))
                
                g1_mulAccC(_pVk, IC56x, IC56y, calldataload(add(pubSignals, 1760)))
                
                g1_mulAccC(_pVk, IC57x, IC57y, calldataload(add(pubSignals, 1792)))
                
                g1_mulAccC(_pVk, IC58x, IC58y, calldataload(add(pubSignals, 1824)))
                
                g1_mulAccC(_pVk, IC59x, IC59y, calldataload(add(pubSignals, 1856)))
                
                g1_mulAccC(_pVk, IC60x, IC60y, calldataload(add(pubSignals, 1888)))
                
                g1_mulAccC(_pVk, IC61x, IC61y, calldataload(add(pubSignals, 1920)))
                
                g1_mulAccC(_pVk, IC62x, IC62y, calldataload(add(pubSignals, 1952)))
                
                g1_mulAccC(_pVk, IC63x, IC63y, calldataload(add(pubSignals, 1984)))
                
                g1_mulAccC(_pVk, IC64x, IC64y, calldataload(add(pubSignals, 2016)))
                
                g1_mulAccC(_pVk, IC65x, IC65y, calldataload(add(pubSignals, 2048)))
                
                g1_mulAccC(_pVk, IC66x, IC66y, calldataload(add(pubSignals, 2080)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            
            checkField(calldataload(add(_pubSignals, 416)))
            
            checkField(calldataload(add(_pubSignals, 448)))
            
            checkField(calldataload(add(_pubSignals, 480)))
            
            checkField(calldataload(add(_pubSignals, 512)))
            
            checkField(calldataload(add(_pubSignals, 544)))
            
            checkField(calldataload(add(_pubSignals, 576)))
            
            checkField(calldataload(add(_pubSignals, 608)))
            
            checkField(calldataload(add(_pubSignals, 640)))
            
            checkField(calldataload(add(_pubSignals, 672)))
            
            checkField(calldataload(add(_pubSignals, 704)))
            
            checkField(calldataload(add(_pubSignals, 736)))
            
            checkField(calldataload(add(_pubSignals, 768)))
            
            checkField(calldataload(add(_pubSignals, 800)))
            
            checkField(calldataload(add(_pubSignals, 832)))
            
            checkField(calldataload(add(_pubSignals, 864)))
            
            checkField(calldataload(add(_pubSignals, 896)))
            
            checkField(calldataload(add(_pubSignals, 928)))
            
            checkField(calldataload(add(_pubSignals, 960)))
            
            checkField(calldataload(add(_pubSignals, 992)))
            
            checkField(calldataload(add(_pubSignals, 1024)))
            
            checkField(calldataload(add(_pubSignals, 1056)))
            
            checkField(calldataload(add(_pubSignals, 1088)))
            
            checkField(calldataload(add(_pubSignals, 1120)))
            
            checkField(calldataload(add(_pubSignals, 1152)))
            
            checkField(calldataload(add(_pubSignals, 1184)))
            
            checkField(calldataload(add(_pubSignals, 1216)))
            
            checkField(calldataload(add(_pubSignals, 1248)))
            
            checkField(calldataload(add(_pubSignals, 1280)))
            
            checkField(calldataload(add(_pubSignals, 1312)))
            
            checkField(calldataload(add(_pubSignals, 1344)))
            
            checkField(calldataload(add(_pubSignals, 1376)))
            
            checkField(calldataload(add(_pubSignals, 1408)))
            
            checkField(calldataload(add(_pubSignals, 1440)))
            
            checkField(calldataload(add(_pubSignals, 1472)))
            
            checkField(calldataload(add(_pubSignals, 1504)))
            
            checkField(calldataload(add(_pubSignals, 1536)))
            
            checkField(calldataload(add(_pubSignals, 1568)))
            
            checkField(calldataload(add(_pubSignals, 1600)))
            
            checkField(calldataload(add(_pubSignals, 1632)))
            
            checkField(calldataload(add(_pubSignals, 1664)))
            
            checkField(calldataload(add(_pubSignals, 1696)))
            
            checkField(calldataload(add(_pubSignals, 1728)))
            
            checkField(calldataload(add(_pubSignals, 1760)))
            
            checkField(calldataload(add(_pubSignals, 1792)))
            
            checkField(calldataload(add(_pubSignals, 1824)))
            
            checkField(calldataload(add(_pubSignals, 1856)))
            
            checkField(calldataload(add(_pubSignals, 1888)))
            
            checkField(calldataload(add(_pubSignals, 1920)))
            
            checkField(calldataload(add(_pubSignals, 1952)))
            
            checkField(calldataload(add(_pubSignals, 1984)))
            
            checkField(calldataload(add(_pubSignals, 2016)))
            
            checkField(calldataload(add(_pubSignals, 2048)))
            
            checkField(calldataload(add(_pubSignals, 2080)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }

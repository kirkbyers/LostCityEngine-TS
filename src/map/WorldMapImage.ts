import fs from 'fs';

import { Jimp } from 'jimp';

import Packet from '#/io/Packet.js';

// Floor color table — same as engine/tools/pack/map/Worldmap.ts lines 501-603.
// Each entry: [underlayColor, overlayColor] as packed 24-bit RGB (0x00RRGGBB).
const refColors = [
    [0x00000038, 0x009c8f8e], // cliff
    [0x00000016, 0x004a4242], // cliff2
    [0x00000022, 0x004a4242], // cliff3
    [0x0000002d, 0x00817574], // cliff4
    [0x00000000, 0x003b1d0c], // woodenfloor
    [0x00000000, 0x0050648d], // water
    [0x00000000, 0x00206349], // gungywater
    [0x0000001e, 0x004a4342], // greyroof
    [0x01500053, 0x00c2c2ba], // desertroof
    [0x0000001a, 0x00413b3a], // road
    [0x0000000b, 0x00191616], // darkstone
    [0x00000000, 0x00403935], // pebblefloor
    [0x0000a822, 0x00783633], // redfloor
    [0x0090ec0c, 0x00513a12], // mudfloor
    [0x0090ec0c, 0x00120d03], // mudfloor_bump
    [0x00715411, 0x006f4805], // mudfloor2
    [0x00715411, 0x003c1d01], // mudfloor2_bump
    [0x03815422, 0x00061789], // bluefloor
    [0x00000000, 0x00e36116], // lava
    [0x00000000, 0x004e4e50], // marble
    [0x00915419, 0x00583a03], // sandfloor
    [0x00a09419, 0x004d4320], // l_brownfloor1
    [0x00a09419, 0x00574730], // l_brownfloor1_bump
    [0x00000000, 0x0039332d], // cliff_textured
    [0x00b09435, 0x009b9243], // sand_cliff
    [0x00c06821, 0x005b5441], // sand_rock
    [0x00000000, 0x00282211], // oldbrick
    [0x00000000, 0x00333333], // brick
    [0x01611c14, 0x003b5e0b], // grass
    [0x0150004f, 0x00c8c0c0], // ice_overlay
    [0x00a11012, 0x00734c05], // upass_floor
    [0x00000000, 0x0037312a], // stone_texture
    [0x0150004a, 0x00aaafb4], // ice_overlay_blue
    [0x0000001a, 0x00474040], // road_bridge
    [0x00000000, 0x003b1d0c], // woodenfloor_bridge
    [0x0080f013, 0x0062420d], // mud5_overlay
    [0x00000000, 0x00060505], // black
    [0x03106027, 0x003e516e], // lightblue
    [0x00000000, 0x0079a0d7], // water_fountain
    [0x03808427, 0x004e4a82], // bluefloor2
    [0x03107420, 0x00364c61], // waterfallblue
    [0xff21542a, 0x00503000], // invisible
    [0xff21542a, 0x00503000], // invisible_occ
    [0x0000001a, 0x00474040], // road_no_occlude
    [0x00000000, 0x003b1d0c], // woodenfloor_no_occlude
    [0x00000000, 0x00282211], // oldbrick_no_occlude
    [0x00000000, 0x00333333], // brick_no_occlude
    [0x01611c14, 0x0036570a], // grassland
    [0x01011413, 0x00393c07], // muddygrass
    [0x00c11c15, 0x00403f07], // vmuddygrass
    [0x0141181f, 0x00556c0e], // lightgrass
    [0x0110ac21, 0x0065832a], // sandygrass
    [0x00d10c0f, 0x00282805], // swamp
    [0x0250e011, 0x0012513d], // swamp2
    [0x00000027, 0x00605656], // lightrock
    [0x00000019, 0x004c4444], // darkrock
    [0x0000000f, 0x00171414], // verydarkrock
    [0x0150004f, 0x00c2bbba], // ice
    [0x01500049, 0x00b6b9bf], // blueice
    [0x01500049, 0x0098a599], // greenice
    [0x00c0742b, 0x00797343], // desert1
    [0x00b0a436, 0x009b9243], // desert2
    [0x0090ec0c, 0x001b1303], // mud1
    [0x0090b415, 0x006b5d22], // mud2
    [0x00a11012, 0x0039280b], // mud3
    [0x00715411, 0x005c2403], // mud4
    [0x0080f013, 0x00665716], // mud5
    [0x00b09435, 0x00b48d4e], // sand
    [0x0090b415, 0x0052471a], // mud2_skew
    [0x00a11012, 0x006c4a0e], // mud3_skew
    [0x00715411, 0x003c2701], // mud4_skew
    [0x00000001, 0x00060505], // black_rock
    [0x03106027, 0x00435e79], // dullblue
    [0xffd06027, 0x008d524f], // purple_pink
    [0x03106027, 0x0043779b], // lightblue_underlay
    [0x00b0a82d, 0x00a9974a], // desert_shadow
    [0x0080782f, 0x00886b4d], // duel_arena
    [0x0080283c, 0x00b47a4e], // duelarena
    [0x00b06826, 0x0071673f], // hive
    [0x0080a41c, 0x00654c20], // agility
    [0x00909012, 0x003c3013], // brownmud
    [0x0090301a, 0x00594f3f], // mountain_overlay
    [0x00903014, 0x00383632], // mountain_dark_overlay
    [0x00000000, 0x007d6a3c], // elfbrick
    [0x01203c0f, 0x00171912], // elf_wastelands
    [0x00015407, 0x00440601], // dark_red
    [0x0390601d, 0x00514c6a], // grey_blue
    [0x00a04417, 0x00433f30], // viking_town_overlay
    [0x0090b814, 0x00625416], // viking_mud_overlay
    [0x00903c0d, 0x002a2726], // viking_cave_overlay
    [0x00909012, 0x00342616], // legendssword_cave
    [0x0090301a, 0x005b5952], // mountain
    [0x01906416, 0x003b512e], // darkgrass
    [0x00903014, 0x00473e33], // mountain_dark
    [0x03108c23, 0x00476980], // grey_blue_underlay
    [0x00a0c40f, 0x004c4618], // autumnal
    [0x00a04419, 0x004f4639], // viking_town
    [0x00a0440d, 0x00392f1f], // viking_town_dark
    [0x01c0a018, 0x001e5f1f], // jungle_green
    [0x0150dc13, 0x001d390b], // jungle_dark_green
    [0x00a0c011, 0x0039300b], // mm_town_overlay
];

let mapBounds: { minX: number; minZ: number; width: number; height: number } | null = null;

export function getMapBounds(): { minX: number; minZ: number; width: number; height: number } {
    if (!mapBounds) {
        throw new Error('World map image has not been generated yet');
    }
    return mapBounds;
}

export async function generateWorldMapImage(): Promise<void> {
    if (!fs.existsSync('data/pack/server/maps')) {
        return;
    }

    const maps: string[] = fs.readdirSync('data/pack/server/maps').filter((x: string): boolean => x[0] === 'm');
    if (maps.length === 0) {
        return;
    }

    // Determine bounding box
    let minMX = Infinity, maxMX = -Infinity, minMZ = Infinity, maxMZ = -Infinity;
    for (const map of maps) {
        const [mx, mz] = map.substring(1).split('_').map((x: string) => parseInt(x));
        if (mx < minMX) minMX = mx;
        if (mx > maxMX) maxMX = mx;
        if (mz < minMZ) minMZ = mz;
        if (mz > maxMZ) maxMZ = mz;
    }

    const mapsquaresX = maxMX - minMX + 1;
    const mapsquaresZ = maxMZ - minMZ + 1;
    const imgWidth = mapsquaresX * 64;
    const imgHeight = mapsquaresZ * 64;

    const minX = minMX * 64;
    const minZ = minMZ * 64;

    mapBounds = { minX, minZ, width: imgWidth, height: imgHeight };

    const img = new Jimp({ width: imgWidth, height: imgHeight, color: 0x000000ff });

    for (const map of maps) {
        const [mx, mz] = map.substring(1).split('_').map((x: string) => parseInt(x));

        let baseLevel = 0;
        if (mx === 33 && mz >= 71 && mz <= 73) {
            baseLevel = 1;
        }

        // Decode tile data — same as Worldmap.ts lines 117-175
        const flags: number[][][] = [];
        const overlayIds: number[][][] = [];
        const underlayIds: number[][][] = [];
        for (let level = 0; level < 4; level++) {
            flags[level] = [];
            overlayIds[level] = [];
            underlayIds[level] = [];
            for (let x = 0; x < 64; x++) {
                flags[level][x] = [];
                overlayIds[level][x] = [];
                underlayIds[level][x] = [];
                for (let z = 0; z < 64; z++) {
                    flags[level][x][z] = 0;
                    overlayIds[level][x][z] = -1;
                    underlayIds[level][x][z] = -1;
                }
            }
        }

        const landBuf = Packet.load(`data/pack/server/maps/m${mx}_${mz}`);
        for (let level = 0; level < 4; level++) {
            for (let x = 0; x < 64; x++) {
                for (let z = 0; z < 64; z++) {
                    while (true) {
                        const opcode = landBuf.g1();
                        if (opcode === 0) {
                            break;
                        } else if (opcode === 1) {
                            landBuf.g1();
                            break;
                        }

                        if (opcode <= 49) {
                            overlayIds[level][x][z] = landBuf.g1();
                        } else if (opcode <= 81) {
                            flags[level][x][z] = opcode - 49;
                        } else {
                            underlayIds[level][x][z] = opcode - 81;
                        }
                    }
                }
            }
        }

        // Resolve bridge flag and base level, then paint pixels
        for (let x = 0; x < 64; x++) {
            for (let z = 0; z < 64; z++) {
                const bridged = (flags[1][x][z] & 0x2) === 2;
                const actualLevel = (bridged ? 1 : 0) + baseLevel;

                const tileX = mx * 64 + x;
                const tileZ = mz * 64 + z;
                const pixelX = tileX - minX;
                const pixelY = (imgHeight - 1) - (tileZ - minZ);

                let rgb = 0;
                const overlayId = overlayIds[actualLevel][x][z];
                const underlayId = underlayIds[actualLevel][x][z];

                if (overlayId !== -1 && overlayId < refColors.length) {
                    rgb = refColors[overlayId][1] & 0x00ffffff;
                } else if (underlayId > 0 && underlayId - 1 < refColors.length) {
                    rgb = refColors[underlayId - 1][1] & 0x00ffffff;
                }

                if (rgb !== 0 && pixelX >= 0 && pixelX < imgWidth && pixelY >= 0 && pixelY < imgHeight) {
                    const pos = (pixelY * imgWidth + pixelX) * 4;
                    img.bitmap.data[pos] = (rgb >> 16) & 0xff;
                    img.bitmap.data[pos + 1] = (rgb >> 8) & 0xff;
                    img.bitmap.data[pos + 2] = rgb & 0xff;
                    img.bitmap.data[pos + 3] = 0xff;
                }
            }
        }
    }

    fs.mkdirSync('public/map', { recursive: true });
    await img.write('public/map/worldmap.png' as `${string}.${string}`);
}

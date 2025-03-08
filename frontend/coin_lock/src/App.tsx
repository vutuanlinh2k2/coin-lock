import { ConnectButton } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { Toaster } from "sonner";

import CoinLock from "./CoinLock";

function App() {
  return (
    <>
      <Container position="sticky" py="4" style={{
        borderBottom: "1px solid var(--gray-a2)",
      }}>
        <Container>
          <Flex justify="between" align="center"><Box>
            <Heading>CoinLock</Heading>
          </Box>

            <Box>
              <ConnectButton />
            </Box></Flex>
        </Container>
      </Container>

      <Container>
        <Container
          mt="3"
          pt="2"
          px="4"
          style={{ background: "var(--gray-a2)", minHeight: 500 }}
        >
          <CoinLock />
        </Container>
      </Container>

      <Toaster richColors position="top-right" />
    </>
  );
}

export default App;

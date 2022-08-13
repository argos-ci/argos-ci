/* eslint-disable react/no-unescaped-entities */
import React from "react";
import styled, { Box } from "@xstyled/styled-components";
import { Button } from "@smooth-ui/core-sc";
import {
  useDisclosureState,
  Disclosure,
  DisclosureContent,
} from "reakit/Disclosure";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardText,
} from "../../../components";
import { getStatusColor } from "../../../modules/build";

const StyledImg = styled.img`
  width: 100%;
  display: block;
`;

function getStatus({ jobStatus, score }) {
  if (jobStatus === "complete") {
    return score === 0 ? "success" : "unknown";
  }
  return jobStatus;
}

function ScreenshotDiffItem({
  screenshotDiff: { jobStatus, score, compareScreenshot, baseScreenshot, url },
}) {
  const status = getStatus({ jobStatus, score });
  const disclosure = useDisclosureState({ visible: status !== "success" });

  return (
    <CardBody borderLeft={2} borderColor={getStatusColor(status)}>
      <CardText as="h4">
        <Disclosure as={Button} {...disclosure} mr={20}>
          {disclosure.visible ? "Hide" : "Show"}
        </Disclosure>
        {compareScreenshot.name}
      </CardText>
      <DisclosureContent {...disclosure}>
        {() =>
          disclosure.visible && (
            <Box row mx={-1}>
              <Box col={1 / 3} px={1}>
                {baseScreenshot ? (
                  <a
                    href={baseScreenshot.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Base screenshot"
                  >
                    <StyledImg
                      alt={baseScreenshot.name}
                      src={baseScreenshot.url}
                    />
                  </a>
                ) : null}
              </Box>
              <Box col={1 / 3} px={1}>
                <a
                  href={compareScreenshot.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Current screenshot"
                >
                  <StyledImg
                    alt={compareScreenshot.name}
                    src={compareScreenshot.url}
                  />
                </a>
              </Box>
              <Box col={1 / 3} px={1}>
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Diff"
                  >
                    <StyledImg alt="diff" src={url} />
                  </a>
                )}
              </Box>
            </Box>
          )
        }
      </DisclosureContent>
    </CardBody>
  );
}

export default function BuildDetailScreenshots({ build }) {
  const [showPassingScreenshots, setShowPassingScreenshots] =
    React.useState(false);

  const screenshotDiffs = Array.from(build.screenshotDiffs);
  screenshotDiffs.sort((itemA, itemB) =>
    itemA.validationStatus > itemB.validationStatus
      ? -1
      : itemA.validationStatus < itemB.validationStatus
      ? 1
      : 0
  );

  return (
    <Box row m={-2}>
      <Box col={1} p={2}>
        <Card>
          <CardHeader>
            <CardTitle>Screenshots</CardTitle>
          </CardHeader>
          {screenshotDiffs.map(
            (screenshotDiff, index) =>
              (showPassingScreenshots || screenshotDiff.score !== 0) && (
                <ScreenshotDiffItem
                  key={index}
                  screenshotDiff={screenshotDiff}
                />
              )
          )}
        </Card>
        <Box mt={{ xs: 3 }}>
          <Button
            onClick={() => setShowPassingScreenshots(!showPassingScreenshots)}
          >
            {showPassingScreenshots
              ? "Hide passing screenshots"
              : "Show passing screenshots"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

import React from 'react';
import { connect } from 'react-redux';

import { Menu } from 'semantic-ui-react';

import { setCurrentChannel, setPrivateChannel } from '../../actions';

import UserPanel from './UserPanel';
import Channels from './Channels';
import DirectMessages from './DirectMessages';
import Starred from './Starred';

class SidePanel extends React.Component {
    render() {
        return (
            <Menu
                size="large"
                inverted
                fixed="left"
                vertical
                style={{ 
                    background: '#4c3c4c',
                    fontSize: '1.2rem'
                }}
            >
                <UserPanel user={this.props.user} />
                <Starred />
                <Channels 
                    user={this.props.user} 
                    channel={this.props.channel}
                    setCurrentChannel={this.props.setCurrentChannel}
                    setPrivateChannel={this.props.setPrivateChannel}
                />
                <DirectMessages user={this.props.user} />
            </Menu>
        );
    }
}

const mapStateToProps = state => ({
    user: state.user.currentUser,
    channel: state.channel.currentChannel
});

export default connect(mapStateToProps, { setCurrentChannel, setPrivateChannel })(SidePanel);